import { useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Job, ProgressPayload } from '../types';
import { open, save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

function norm(p: string) {
  return p.replace(/\\+/g, '/').trim().toLowerCase();
}

export function useConvertQueue() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [converting, setConverting] = useState(false);
  const [picking, setPicking] = useState(false);
  const [savedThisSession, setSavedThisSession] = useState<Job[]>([]);

  // ---- NEW: pending queue tách khỏi React state
  const runningRef = useRef(false);

  // chống gọi trùng 2 lần cùng batch
  const lastBatchKeyRef = useRef<{ key: string; ts: number } | null>(null);

  // soft progress timers
  const softTimersRef = useRef<Map<string, number>>(new Map());

  async function pickFiles(): Promise<string[]> {
    try {
      setPicking(true);
      const res = await open({
        multiple: true,
        filters: [{ name: 'CAJ', extensions: ['caj'] }],
      });
      if (!res) return [];
      return Array.isArray(res) ? res : [res];
    } finally {
      setPicking(false);
    }
  }

  // 1) pending lưu Job luôn, không chỉ id
  const pendingJobsRef = useRef<Job[]>([]);

  // 2) queuePaths: thuần, không side-effect trong updater
  async function queuePaths(paths: string[]) {
    // dedupe input
    const pickedMap = new Map<string, string>();
    for (const raw of paths) {
      const p = raw.toString();
      const k = norm(p);
      if (!pickedMap.has(k)) pickedMap.set(k, p);
    }

    // dùng snapshot hiện tại của state, không tạo side-effect trong updater
    const existsActive = new Set(
      jobs
        .filter((j) => j.status === 'queued' || j.status === 'running')
        .map((j) => norm(j.inputPath))
    );
    const toCreate: Job[] = [];
    for (const [_, original] of pickedMap) {
      const k = norm(original);
      if (existsActive.has(k)) continue;
      toCreate.push({
        id: uuidv4(),
        name: original.split(/[\\/]/).pop() || original,
        inputPath: original,
        status: 'queued',
        percent: 0,
      });
    }

    if (toCreate.length) {
      // một lần set, thuần
      setJobs((prev) => [...prev, ...toCreate]);
    }
    return toCreate;
  }

  // 3) ensureRunner nhận Job trực tiếp, không cần chờ state commit để "find"
  async function ensureRunner() {
    if (runningRef.current) return;
    if (pendingJobsRef.current.length === 0) return;

    runningRef.current = true;
    setConverting(true);
    try {
      while (pendingJobsRef.current.length > 0) {
        const job = pendingJobsRef.current.shift()!;

        // chuyển state sang running (nếu đã commit thì cập nhật, nếu chưa thì
        // lần set sau cũng sẽ áp dụng đúng vì cùng id)
        setJobs((prev) =>
          prev.map((x) =>
            x.id === job.id
              ? { ...x, status: 'running', percent: Math.max(x.percent, 1) }
              : x
          )
        );

        await runOne(job);
      }
    } finally {
      runningRef.current = false;
      setConverting(false);
      if (pendingJobsRef.current.length > 0) void ensureRunner();
    }
  }

  // chạy 1 job (giữ nguyên như bạn có)
  async function runOne(job: Job) {
    let unlisten: UnlistenFn | null = null;
    startSoft(job.id);
    try {
      unlisten = await listen<ProgressPayload>(
        'convert-progress',
        ({ payload }) => {
          if (!payload || norm(payload.input) !== norm(job.inputPath)) return;

          if (
            payload.phase === 'running' &&
            typeof payload.percent === 'number'
          ) {
            setJobs((prev) =>
              prev.map((j) =>
                j.id === job.id
                  ? {
                      ...j,
                      percent: Math.max(
                        j.percent,
                        Math.min(100, Math.round(payload.percent!))
                      ),
                    }
                  : j
              )
            );
          } else if (payload.phase === 'error') {
            stopSoft(job.id);
            setJobs((prev) =>
              prev.map((j) =>
                j.id === job.id
                  ? { ...j, status: 'error', error: payload.message || 'Error' }
                  : j
              )
            );
          } else if (payload.phase === 'finish') {
            stopSoft(job.id);
            setJobs((prev) =>
              prev.map((j) => (j.id === job.id ? { ...j, percent: 100 } : j))
            );
          }
        }
      );

      const outPath = await invoke<string>('convert_caj_to_pdf', {
        inputPath: job.inputPath,
        ocr: false,
      });

      stopSoft(job.id);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? { ...j, status: 'done', percent: 100, tempOut: outPath }
            : j
        )
      );
    } catch (e: any) {
      stopSoft(job.id);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id ? { ...j, status: 'error', error: String(e) } : j
        )
      );
    } finally {
      if (unlisten) await unlisten();
    }
  }

  function startSoft(jobId: string) {
    stopSoft(jobId);
    const id = window.setInterval(() => {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId || j.status !== 'running') return j;
          const cap = 99;
          const step = 1;
          const next = Math.min(cap, Math.max(j.percent, 1) + step);
          return next === j.percent ? j : { ...j, percent: next };
        })
      );
    }, 150);
    softTimersRef.current.set(jobId, id);
  }
  function stopSoft(jobId: string) {
    const id = softTimersRef.current.get(jobId);
    if (id) {
      window.clearInterval(id);
      softTimersRef.current.delete(jobId);
    }
  }

  // 4) enqueueAndRun: dùng toCreate trả về, không phụ thuộc updater
  async function enqueueAndRun(paths: string[]) {
    const key = JSON.stringify([...new Set(paths.map((p) => norm(p)))].sort());
    const now = Date.now();
    if (
      lastBatchKeyRef.current &&
      lastBatchKeyRef.current.key === key &&
      now - lastBatchKeyRef.current.ts < 400
    ) {
      return;
    }
    lastBatchKeyRef.current = { key, ts: now };

    const toCreate = await queuePaths(paths);
    if (toCreate.length) {
      pendingJobsRef.current.push(...toCreate); // đẩy Job, không phải id
      void ensureRunner();
    }
  }

  async function saveAs(job: Job) {
    const defaultName = job.name.replace(/\.caj$/i, '.pdf');
    const target = await save({
      defaultPath: defaultName,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (!target) return;
    if (job.tempOut) {
      await invoke('move_output', { from: job.tempOut, to: target });
    }
    setJobs((prev) =>
      prev.map((j) =>
        j.id === job.id ? { ...j, savedTo: target, status: 'done' } : j
      )
    );
    setSavedThisSession((prev) => [
      ...prev,
      { ...job, savedTo: target, status: 'done' },
    ]);
  }

  // removeJob: loại khỏi pendingJobsRef (không dùng pendingIdsRef nữa)
  async function removeJob(jobId: string) {
    // nếu còn trong hàng đợi chưa chạy thì bỏ ra
    pendingJobsRef.current = pendingJobsRef.current.filter(
      (j) => j.id !== jobId
    );

    const job = jobs.find((j) => j.id === jobId);
    if (job?.status === 'done' && job.tempOut && !job.savedTo) {
      try {
        await invoke('delete_file', { path: job.tempOut });
      } catch {}
    }
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }

  async function openFile(path: string) {
    await invoke('open_file', { path });
  }
  async function reveal(path: string) {
    await invoke('reveal_in_folder', { path });
  }

  function clearAll() {
    pendingJobsRef.current = [];
    setJobs([]);
    setSavedThisSession([]);
  }

  return {
    jobs,
    busy: converting,
    picking,
    savedThisSession,

    pickFiles,
    enqueueAndRun,
    saveAs,
    removeJob,
    openFile,
    reveal,
    clearAll,
  };
}
