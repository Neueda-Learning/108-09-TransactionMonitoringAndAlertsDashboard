import { useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { formatDateTime, formatMoney } from '../utils/formatters';

export default function DashboardPage({ transactions, rules, loading, error, onRetry }) {
  const metrics = useMemo(() => {
    const activeRules = rules.filter((rule) => rule.active).length;
    const volume = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    return {
      transactionsCount: transactions.length,
      activeRules,
      volume
    };
  }, [transactions, rules]);

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.transactionTime) - new Date(a.transactionTime)).slice(0, 5),
    [transactions]
  );

  return (
    <section>
      <PageHeader
        title="Dashboard"
        subtitle="Operational view of transactions and rule configuration"
      />

      {error ? (
        <ErrorState message="Unable to load dashboard data." error={error} onRetry={onRetry} />
      ) : null}

      <div className="card-grid">
        <article className="card">
          <h3>Total Transactions</h3>
          <strong>{metrics.transactionsCount}</strong>
        </article>
        <article className="card">
          <h3>Active Rules</h3>
          <strong>{metrics.activeRules}</strong>
        </article>
        <article className="card">
          <h3>Transaction Volume</h3>
          <strong>{formatMoney(metrics.volume, 'INR')}</strong>
        </article>
      </div>

      <article className="panel">
        <h2>Recent Transactions</h2>
        {loading ? <SkeletonLoader rows={5} rowHeight={18} /> : null}
        {!loading && recentTransactions.length === 0 ? (
          <EmptyState
            icon={<span aria-hidden="true">[i]</span>}
            message="No transactions available."
            actionLabel={onRetry ? 'Retry' : ''}
            onAction={onRetry}
          />
        ) : null}

        {!loading && recentTransactions.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Account</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Time (MM/DD/YYYY)</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id || tx.transactionId}>
                    <td data-label="Transaction ID">{tx.transactionId}</td>
                    <td data-label="Account">{tx.accountId}</td>
                    <td data-label="Amount">{formatMoney(tx.amount, tx.currency || 'USD')}</td>
                    <td data-label="Status">
                      <StatusBadge value={tx.status} />
                    </td>
                    <td data-label="Time">{formatDateTime(tx.transactionTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>
    </section>
  );
}

