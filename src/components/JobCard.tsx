import type { Job } from '../types';

type Props = {
  job: Job;
  onSave: (job: Job) => void;
  onOpen: (path: string) => void;
  onReveal: (path: string) => void;
  onRemove: () => void;
};

export default function JobCard({
  job,
  onSave,
  onOpen,
  onReveal,
  onRemove,
}: Props) {
  const badge =
    job.status === 'queued'
      ? { text: 'Chờ', cls: 'bg-slate-100 text-slate-700' }
      : job.status === 'running'
      ? { text: 'Đang chuyển', cls: 'bg-indigo-100 text-indigo-700' }
      : job.status === 'done'
      ? {
          text: job.savedTo ? 'Đã lưu' : 'Sẵn sàng lưu',
          cls: 'bg-emerald-100 text-emerald-700',
        }
      : { text: 'Lỗi', cls: 'bg-rose-100 text-rose-700' };

  return (
    <li className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold truncate" title={job.inputPath}>
          {job.name}
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${badge.cls}`}>
          {badge.text}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 transition-[width]"
            style={{ width: `${Math.round(job.percent)}%` }}
          />
        </div>
      </div>

      {job.status === 'error' && job.error && (
        <div className="text-rose-600 mt-3 text-sm">{job.error}</div>
      )}

      <div className="mt-3">
        {job.status === 'done' && !job.savedTo && (
          <button
            className="px-3 py-2 rounded-xl bg-gradient-to-b from-sky-500 to-blue-600 text-white shadow hover:brightness-110"
            onClick={() => onSave(job)}
          >
            Lưu thành…
          </button>
        )}
        {job.savedTo && (
          <div className="flex items-center gap-3">
            <div
              className="min-w-0 flex-1 text-slate-600 truncate"
              title={job.savedTo}
            >
              Đã lưu: {job.savedTo}
            </div>

            <div className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap">
              <button
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50"
                onClick={() => onOpen(job.savedTo!)}
              >
                Mở tệp
              </button>
              <button
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50"
                onClick={() => onReveal(job.savedTo!)}
              >
                Mở thư mục
              </button>
              {(job.status === 'done' || job.status === 'error') && (
                <button
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                  onClick={onRemove}
                >
                  Xoá
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
