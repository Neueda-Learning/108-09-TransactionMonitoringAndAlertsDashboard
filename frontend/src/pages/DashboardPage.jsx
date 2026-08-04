import { useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime, formatMoney } from '../utils/formatters';

export default function DashboardPage({ transactions, rules, loading, error }) {
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

      {error ? <div className="error-box">{error}</div> : null}

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
        {loading ? <p>Loading...</p> : null}
        {!loading && recentTransactions.length === 0 ? <p>No transactions available.</p> : null}

        {!loading && recentTransactions.length > 0 ? (
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
                  <td>{tx.transactionId}</td>
                  <td>{tx.accountId}</td>
                  <td>{formatMoney(tx.amount, tx.currency || 'USD')}</td>
                  <td>
                    <StatusBadge value={tx.status} />
                  </td>
                  <td>{formatDateTime(tx.transactionTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </article>
    </section>
  );
}

