import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Sparkline from '../components/charts/Sparkline';
import TransactionVolumeChart from '../components/charts/TransactionVolumeChart';
import ActivityHeatmap from '../components/charts/ActivityHeatmap';

// ─── Locale-normalised formatters (en-US everywhere on this page) ────────────
const LOCALE = 'en-US';

function fmtMoney(amount, currency = 'USD') {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return '—';
  }
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(Number(amount));
}

function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ─── Trend helpers ────────────────────────────────────────────────────────────
function trendDir(current, prior) {
  if (prior === 0 && current === 0) return 'neutral';
  if (prior === 0) return 'up';
  if (current > prior) return 'up';
  if (current < prior) return 'down';
  return 'neutral';
}

function TrendChip({ direction }) {
  if (direction === 'up') {
    return (
      <span className="trend-chip trend-chip--up" aria-label="trending up">
        ▲
      </span>
    );
  }
  if (direction === 'down') {
    return (
      <span className="trend-chip trend-chip--down" aria-label="trending down">
        ▼
      </span>
    );
  }
  return (
    <span className="trend-chip trend-chip--neutral" aria-label="no change">
      —
    </span>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'transactionId', label: 'Transaction ID', width: '22%' },
  { key: 'accountId',     label: 'Account',        width: '16%' },
  { key: 'amount',        label: 'Amount',         width: '16%' },
  { key: 'status',        label: 'Status',         width: '14%' },
  { key: 'transactionTime', label: 'Date / Time',  width: '32%' }
];

// ─── Quick-link destination definitions ──────────────────────────────────────
const QUICK_LINKS = [
  { to: '/transactions', label: 'Transactions', description: 'Browse and manage all transactions' },
  { to: '/rules',        label: 'Rules',        description: 'Configure monitoring rules'         },
  { to: '/alerts',       label: 'Alerts',       description: 'Review generated alerts'            }
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage({ transactions, rules, loading, error, onRetry }) {
  const [sortKey, setSortKey] = useState('transactionTime');
  const [sortDir, setSortDir] = useState('desc');

  // ── Metrics + trends + sparkline data ───────────────────────────────────
  const { metrics, trends, sparklines } = useMemo(() => {
    const byTime = [...transactions].sort(
      (a, b) => new Date(a.transactionTime) - new Date(b.transactionTime)
    );
    const mid = Math.floor(byTime.length / 2);
    const priorHalf   = byTime.slice(0, mid);
    const currentHalf = byTime.slice(mid);

    const sumVolume = (arr) => arr.reduce((s, tx) => s + Number(tx.amount || 0), 0);

    const priorVolume   = sumVolume(priorHalf);
    const currentVolume = sumVolume(currentHalf);

    const activeRules = rules.filter((r) => r.active).length;
    const totalVolume  = sumVolume(transactions);

    // Bucket transactions by day → count array for sparklines
    const countMap = new Map();
    const volMap   = new Map();
    for (const tx of byTime) {
      const raw = tx.transactionTime || tx.createdAt;
      if (!raw) continue;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10);
      countMap.set(key, (countMap.get(key) || 0) + 1);
      volMap.set(key, (volMap.get(key) || 0) + Number(tx.amount || 0));
    }
    const txSpark  = Array.from(countMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
    const volSpark = Array.from(volMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
    const highSev  = rules.filter((r) => r.active && r.severity === 'HIGH').length;
    const highSpark = txSpark.length > 0 ? txSpark.map(() => highSev) : [highSev];

    return {
      metrics: {
        transactionsCount: transactions.length,
        activeRules,
        volume: totalVolume
      },
      trends: {
        transactions: trendDir(currentHalf.length, priorHalf.length),
        volume:       trendDir(currentVolume, priorVolume),
        activeRules:  'neutral'
      },
      sparklines: {
        transactions: txSpark,
        volume:       volSpark,
        highSeverity: highSpark,
      }
    };
  }, [transactions, rules]);

  // ── Top risk highlights ──────────────────────────────────────────────────
  const riskHighlights = useMemo(() => ({
    highSeverityRules:   rules.filter((r) => r.active && r.severity === 'HIGH').length,
    pendingTransactions: transactions.filter((tx) => tx.status === 'PENDING').length
  }), [transactions, rules]);

  // ── Sortable recent-transactions (no new API calls) ──────────────────────
  const sortedRows = useMemo(() => {
    const pool = [...transactions]
      .sort((a, b) => new Date(b.transactionTime) - new Date(a.transactionTime))
      .slice(0, 10);

    return pool.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';

      let cmp;
      if (sortKey === 'amount') {
        cmp = Number(av) - Number(bv);
      } else if (sortKey === 'transactionTime') {
        cmp = new Date(av) - new Date(bv);
      } else {
        cmp = String(av).localeCompare(String(bv), LOCALE);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [transactions, sortKey, sortDir]);

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <section>
      <PageHeader
        title="Dashboard"
        subtitle="Operational view of transactions and rule configuration"
      />

      {error ? (
        <ErrorState message="Unable to load dashboard data." error={error} onRetry={onRetry} />
      ) : null}

      {/* ── Metric cards ── */}
      <section aria-labelledby="dashboard-metrics-heading">
        <h2 id="dashboard-metrics-heading" className="sr-only">Dashboard metrics</h2>
        <div className="card-grid" aria-label="Key metrics">
          <article className="card">
            <h3>Total Transactions</h3>
            <strong>
              {metrics.transactionsCount}
              <TrendChip direction={trends.transactions} />
            </strong>
            <Sparkline data={sparklines.transactions} label="Transaction count trend" height={56} />
          </article>
          <article className="card">
            <h3>Active Rules</h3>
            <strong>
              {metrics.activeRules}
              <TrendChip direction={trends.activeRules} />
            </strong>
            <Sparkline data={sparklines.highSeverity} color="var(--color-warn)" label="High-severity rules trend" height={56} />
          </article>
          <article className="card">
            <h3>Transaction Volume</h3>
            <strong>
              {fmtMoney(metrics.volume, 'INR')}
              <TrendChip direction={trends.volume} />
            </strong>
            <Sparkline data={sparklines.volume} color="var(--color-success)" label="Transaction volume trend" height={56} />
          </article>
        </div>
      </section>

      {/* ── Top risk highlights ── */}
      <section aria-labelledby="dashboard-risk-heading">
        <h2 id="dashboard-risk-heading" className="sr-only">Risk highlights</h2>
        <div className="card-grid risk-highlights" aria-label="Risk highlights">
          <article className="card card--risk">
            <h3>High-Severity Active Rules</h3>
            <strong className="risk-value">{riskHighlights.highSeverityRules}</strong>
          </article>
          <article className="card card--risk">
            <h3>Pending Transactions</h3>
            <strong className="risk-value">{riskHighlights.pendingTransactions}</strong>
          </article>
        </div>
      </section>

      {/* ── Transaction Volume Chart ── */}
      <article className="panel">
        <h2>Transaction Volume Over Time</h2>
        <TransactionVolumeChart transactions={transactions} />
      </article>

      {/* ── Activity Heatmap ── */}
      <article className="panel">
        <h2>Transaction Activity Heatmap (Last 12 Weeks)</h2>
        <ActivityHeatmap transactions={transactions} />
      </article>

      {/* ── Recent Transactions ── */}
      <article className="panel">
        <h2>Recent Transactions</h2>

        {loading ? <SkeletonLoader rows={5} rowHeight={18} /> : null}

        {!loading && sortedRows.length === 0 ? (
          <EmptyState
            icon={<span aria-hidden="true">⊘</span>}
            message="No transactions available."
            actionLabel={onRetry ? 'Retry' : ''}
            onAction={onRetry}
          />
        ) : null}

        {!loading && sortedRows.length > 0 ? (
          <div className="table-container table-container--responsive dashboard-table-scroll">
            <table className="data-table data-table--sticky-first-column">
              <caption className="sr-only">Recent transactions table</caption>
              <colgroup>
                {COLUMNS.map((col) => (
                  <col key={col.key} style={{ width: col.width }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {COLUMNS.map((col) => {
                    const isActive = sortKey === col.key;
                    const ariaSortVal = isActive
                      ? sortDir === 'asc' ? 'ascending' : 'descending'
                      : 'none';
                    return (
                      <th
                        key={col.key}
                        scope="col"
                        className={`sortable-th${isActive ? ' sortable-th--active' : ''}`}
                        aria-sort={ariaSortVal}
                      >
                        <button
                          type="button"
                          className="th-button"
                          onClick={() => handleSort(col.key)}
                          aria-label={`Sort by ${col.label}${isActive ? `, currently ${sortDir === 'asc' ? 'ascending' : 'descending'}` : ''}`}
                        >
                          {col.label}
                          <span className="sort-icon" aria-hidden="true">
                            {isActive ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((tx) => (
                  <tr key={tx.id ?? tx.transactionId}>
                    <td data-label="Transaction ID">{tx.transactionId}</td>
                    <td data-label="Account">{tx.accountId}</td>
                    <td data-label="Amount">{fmtMoney(tx.amount, tx.currency || 'USD')}</td>
                    <td data-label="Status">
                      <StatusBadge value={tx.status} />
                    </td>
                    <td data-label="Date / Time">{fmtDate(tx.transactionTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>

      {/* ── Quick-link cards ── */}
      <section aria-labelledby="dashboard-quick-links-heading">
        <h2 id="dashboard-quick-links-heading" className="sr-only">Quick navigation</h2>
        <div className="card-grid" aria-label="Quick navigation">
          {QUICK_LINKS.map((ql) => (
            <Link key={ql.to} to={ql.to} className="card card--link">
              <h3>{ql.label}</h3>
              <p className="card-link-desc">{ql.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
