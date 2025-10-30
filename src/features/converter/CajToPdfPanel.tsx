type Props = {
  busy: boolean; // đang convert (để hiển thị text)
  picking: boolean; // đang mở dialog (để disable nút)
  pickFiles: () => Promise<string[]>;
  enqueueAndRun: (paths: string[]) => Promise<void>;
};

export default function CajToPdfPanel({
  busy,
  picking,
  pickFiles,
  enqueueAndRun,
}: Props) {
  async function handleChoose() {
    const paths = await pickFiles();
    if (!paths.length) return;
    await enqueueAndRun(paths);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Chuyển CAJ → PDF</div>
          <p className="text-sm text-slate-500 mt-1">
            Chọn tệp từ máy để bắt đầu chuyển định dạng.
          </p>
        </div>
        <button
          onClick={handleChoose}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-gradient-to-b from-sky-500 to-blue-600 text-white shadow hover:brightness-110 transition disabled:opacity-60"
        >
          {busy ? 'Đang xử lý...' : 'Chọn tệp'}
        </button>
      </div>
    </section>
  );
}
