type Props = {
  busy: boolean;
  onClear: () => void;
  canClear: boolean;
};
export default function Header({ busy, onClear, canClear }: Props) {
  return (
    <header className="flex items-center justify-between">
      <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
        Trình chuyển đổi
      </div>
      <div className="flex gap-2">
        <button
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
          onClick={onClear}
          disabled={busy || !canClear}
        >
          Xoá danh sách
        </button>
      </div>
    </header>
  );
}
