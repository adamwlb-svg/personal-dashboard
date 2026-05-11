export default function DashboardPage() {
  return (
    <div className="p-8 overflow-y-auto flex-1">
      <h1 className="text-2xl font-semibold text-white mb-2">Dashboard</h1>
      <p className="text-gray-400 text-sm">Welcome back. Here&apos;s your overview.</p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Schedule", description: "Upcoming events" },
          { label: "To-Do", description: "Open tasks" },
          { label: "Health", description: "Weekly stats" },
          { label: "Finances", description: "Monthly summary" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-surface-raised border border-surface-border rounded-xl p-5"
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">
              {card.label}
            </p>
            <p className="mt-1 text-sm text-gray-400">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
