export default function HealthPage() {
  return (
    <div className="p-8 overflow-y-auto flex-1">
      <h1 className="text-2xl font-semibold text-white mb-2">Health</h1>
      <p className="text-gray-400 text-sm">Log and track your health metrics.</p>

      <div className="mt-8 bg-surface-raised border border-surface-border rounded-xl p-6">
        <p className="text-gray-500 text-sm text-center py-12">
          No health data yet — start logging to see your trends.
        </p>
      </div>
    </div>
  );
}
