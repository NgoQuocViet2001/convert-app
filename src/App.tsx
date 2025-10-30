import Header from './components/Header';
import JobCard from './components/JobCard';
import SavedList from './components/SavedList';
import ConverterPicker from './components/ConverterPicker';
import { useConvertQueue } from './hooks/useConvertQueue';
import CajToPdfPanel from './features/converter/CajToPdfPanel';

export default function App() {
  const {
    jobs,
    busy, // converting
    picking, // dialog state
    savedThisSession,
    pickFiles,
    enqueueAndRun,
    saveAs,
    openFile,
    reveal,
    clearAll,
    removeJob,
  } = useConvertQueue();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Header busy={busy} onClear={clearAll} canClear={jobs.length > 0} />

        <ConverterPicker />

        <CajToPdfPanel
          busy={busy}
          picking={picking}
          pickFiles={pickFiles}
          enqueueAndRun={enqueueAndRun}
        />

        {jobs.length > 0 && (
          <ul className="space-y-3">
            {jobs.map((j) => (
              <JobCard
                key={j.id}
                job={j}
                onSave={saveAs}
                onOpen={openFile}
                onReveal={reveal}
                onRemove={() => removeJob(j.id)}
              />
            ))}
          </ul>
        )}

        <SavedList
          items={savedThisSession}
          onOpen={openFile}
          onReveal={reveal}
        />

        <footer className="pt-6 pb-8 text-center text-slate-500 text-xs">
          Hoạt động ngoại tuyến • Bảo mật • Tự động tối ưu (không cần bật OCR)
        </footer>
      </div>
    </div>
  );
}
