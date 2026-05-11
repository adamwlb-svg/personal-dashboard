export default function FinancesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-2">Finances</h1>
      <p className="text-gray-400 text-sm">Monitor your spending and savings.</p>

      <div className="mt-8 bg-surface-raised border border-surface-border rounded-xl p-6">
        <p className="text-gray-500 text-sm text-center py-12">
          No financial data yet — connect an account or add a transaction.
        </p>
      </div>
    </div>
  );
}
