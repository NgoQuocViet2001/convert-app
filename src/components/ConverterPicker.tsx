export default function ConverterPicker() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
      <div className="text-sm text-slate-600 mb-2">Đang chọn:</div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-sm font-medium">
          CAJ → PDF
        </span>
        <span className="text-slate-500 text-sm"> </span>
      </div>
    </div>
  );
}
