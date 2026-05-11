export default function SchedulePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-2">Schedule</h1>
      <p className="text-gray-400 text-sm">Your upcoming events and calendar.</p>

      <div className="mt-8 bg-surface-raised border border-surface-border rounded-xl p-6">
        <p className="text-gray-500 text-sm text-center py-12">
          No events yet — schedule something to get started.
        </p>
      </div>
    </div>
  );
}
