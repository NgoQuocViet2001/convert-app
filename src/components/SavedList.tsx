import type { Job } from '../types';

type Props = {
  items: Job[];
  onOpen: (path: string) => void;
  onReveal: (path: string) => void;
};

export default function SavedList({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
      <h3 className="text-sm text-slate-600 font-semibold mb-2">
        Đã lưu trong phiên này
      </h3>
      <ul className="space-y-2">
        {items.map((j) => (
          <li key={j.id} className="flex items-center gap-2">
            <span className="flex-1 truncate text-slate-700" title={j.savedTo}>
              {j.savedTo}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
