export default function TodoPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-2">To-Do</h1>
      <p className="text-gray-400 text-sm">Track tasks and mark them complete.</p>

      <div className="mt-8 bg-surface-raised border border-surface-border rounded-xl p-6">
        <p className="text-gray-500 text-sm text-center py-12">
          No tasks yet — add one to get started.
        </p>
      </div>
    </div>
  );
}
