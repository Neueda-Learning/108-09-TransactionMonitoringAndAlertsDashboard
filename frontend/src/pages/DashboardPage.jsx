import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime, formatMoney } from '../utils/formatters';

const COLORS = {
  primary: '#4f7eff',
  accent: '#00d4ff',
  success: '#00c48c',
  warning: '#f59e0b',
  danger: '#f43f5e',
  purple: '#7c3aed',
  muted: '#6b7da8'
};

const PIE_COLORS = [COLORS.success, COLORS.warning, COLORS.danger];
const TYPE_COLORS = [COLORS.danger, COLORS.success];

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#162040', border: '1px solid #263660',
        borderRadius: 10, padding: '10px 14px', color: '#e8edf8', fontSize: 13
      }}>
        {label && <div style={{ color: '#6b7da8', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>}
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color || p.fill, fontWeight: 700 }}>
            {p.name}: {typeof p.value === 'number' && p.value > 999 ? `₹${p.value.toLocaleString()}` : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function DashboardPage({ transactions, rules, loading, error }) {
  const metrics = useMemo(() => {
    const activeRules = rules.filter((rule) => rule.active).length;
    const volume = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const completed = transactions.filter((tx) => tx.status === 'COMPLETED').length;
    const pending = transactions.filter((tx) => tx.status === 'PENDING').length;
    const failed = transactions.filter((tx) => tx.status === 'FAILED').length;

    return {
      transactionsCount: transactions.length,
      activeRules,
      volume,
      completed,
      pending,
      failed
    };
  }, [transactions, rules]);

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.transactionTime) - new Date(a.transactionTime)).slice(0, 5),
    [transactions]
  );

  // Chart: transactions by day (last 7 days)
  const volumeByDay = useMemo(() => {
    const map = {};
    transactions.forEach((tx) => {
      if (!tx.transactionTime) return;
      const date = new Date(tx.transactionTime);
      const key = `${date.getMonth() + 1}/${date.getDate()}`;
      if (!map[key]) map[key] = { date: key, volume: 0, count: 0 };
      map[key].volume += Number(tx.amount || 0);
      map[key].count += 1;
    });
    return Object.values(map).slice(-7);
  }, [transactions]);

  // Chart: status distribution
  const statusDistribution = useMemo(() => {
    const counts = { COMPLETED: 0, PENDING: 0, FAILED: 0 };
    transactions.forEach((tx) => {
      if (counts[tx.status] !== undefined) counts[tx.status]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // Chart: debit vs credit
  const typeDistribution = useMemo(() => {
    const counts = { DEBIT: 0, CREDIT: 0 };
    transactions.forEach((tx) => {
      if (counts[tx.transactionType] !== undefined) counts[tx.transactionType]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // Chart: top accounts by volume
  const topAccounts = useMemo(() => {
    const map = {};
    transactions.forEach((tx) => {
      if (!tx.accountId) return;
      if (!map[tx.accountId]) map[tx.accountId] = { account: tx.accountId, volume: 0 };
      map[tx.accountId].volume += Number(tx.amount || 0);
    });
    return Object.values(map)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 6)
      .map((d) => ({ ...d, account: d.account.length > 10 ? d.account.slice(0, 10) + '…' : d.account }));
  }, [transactions]);

  return (
    <section>
      <PageHeader
        title="Dashboard"
        subtitle="Real-time operational view of transactions and rule configuration"
      />

      {error ? <div className="error-box">⚠ {error}</div> : null}

      {/* ── KPI CARDS ── */}
      <div className="card-grid">
        <article className="card stat-card-primary">
          <div className="card-icon" style={{ background: 'rgba(79,126,255,0.15)', color: '#4f7eff' }}>⬡</div>
          <h3>Total Transactions</h3>
          <strong>{metrics.transactionsCount}</strong>
          <div className="card-trend">↑ Live data</div>
        </article>
        <article className="card stat-card-success">
          <div className="card-icon" style={{ background: 'rgba(0,196,140,0.15)', color: '#00c48c' }}>✓</div>
          <h3>Completed</h3>
          <strong>{metrics.completed}</strong>
          <div className="card-trend" style={{ color: '#00c48c' }}>
            {metrics.transactionsCount > 0
              ? `${((metrics.completed / metrics.transactionsCount) * 100).toFixed(0)}% success rate`
              : '—'}
          </div>
        </article>
        <article className="card stat-card-warning">
          <div className="card-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>⏳</div>
          <h3>Pending</h3>
          <strong>{metrics.pending}</strong>
          <div className="card-trend" style={{ color: '#f59e0b' }}>Awaiting processing</div>
        </article>
        <article className="card stat-card-danger">
          <div className="card-icon" style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}>✗</div>
          <h3>Failed</h3>
          <strong>{metrics.failed}</strong>
          <div className="card-trend" style={{ color: '#f43f5e' }}>Requires attention</div>
        </article>
        <article className="card stat-card-primary">
          <div className="card-icon" style={{ background: 'rgba(0,212,255,0.12)', color: '#00d4ff' }}>₹</div>
          <h3>Transaction Volume</h3>
          <strong style={{ fontSize: 22 }}>{formatMoney(metrics.volume, 'INR')}</strong>
          <div className="card-trend">Total value</div>
        </article>
        <article className="card stat-card-success">
          <div className="card-icon" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>⚙</div>
          <h3>Active Rules</h3>
          <strong>{metrics.activeRules}</strong>
          <div className="card-trend" style={{ color: '#a78bfa' }}>of {rules.length} total</div>
        </article>
      </div>

      {/* ── CHARTS ROW ── */}
      {transactions.length > 0 && (
        <div className="chart-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
          {/* Volume area chart */}
          <div className="chart-panel">
            <h3><span className="dot"></span>Transaction Volume Over Time</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={volumeByDay} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f7eff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4f7eff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,126,255,0.08)" />
                <XAxis dataKey="date" tick={{ fill: '#6b7da8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7da8', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="volume" name="Volume (₹)" stroke="#4f7eff" strokeWidth={2.5} fill="url(#volGrad)" dot={false} activeDot={{ r: 5, fill: '#4f7eff', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status donut */}
          <div className="chart-panel">
            <h3><span className="dot" style={{ background: '#00c48c' }}></span>Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" nameKey="name">
                  {statusDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#b0bcd8', fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── SECOND CHARTS ROW ── */}
      {transactions.length > 0 && (
        <div className="chart-grid">
          {/* Daily count bar */}
          <div className="chart-panel">
            <h3><span className="dot" style={{ background: '#00d4ff' }}></span>Daily Transaction Count</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeByDay} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#4f7eff" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,126,255,0.08)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#6b7da8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7da8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Transactions" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Debit vs Credit */}
          <div className="chart-panel">
            <h3><span className="dot" style={{ background: '#f43f5e' }}></span>Debit vs Credit</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeDistribution} cx="50%" cy="50%" outerRadius={75} paddingAngle={5} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {typeDistribution.map((_, i) => (
                    <Cell key={i} fill={TYPE_COLORS[i]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top accounts */}
          <div className="chart-panel">
            <h3><span className="dot" style={{ background: '#f59e0b' }}></span>Top Accounts by Volume</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topAccounts} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,126,255,0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7da8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="account" tick={{ fill: '#b0bcd8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="volume" name="Volume (₹)" fill="url(#accGrad)" radius={[0, 6, 6, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── RECENT TRANSACTIONS ── */}
      <article className="panel">
        <h2>Recent Transactions</h2>
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading transactions…</span>
          </div>
        ) : null}
        {!loading && recentTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No transactions available.</p>
          </div>
        ) : null}

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
                  <td style={{ fontFamily: 'monospace', fontSize: 13, color: '#7ab2ff' }}>{tx.transactionId}</td>
                  <td>{tx.accountId}</td>
                  <td style={{ fontWeight: 600 }}>{formatMoney(tx.amount, tx.currency || 'USD')}</td>
                  <td>
                    <StatusBadge value={tx.status} />
                  </td>
                  <td style={{ color: '#6b7da8', fontSize: 13 }}>{formatDateTime(tx.transactionTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </article>
    </section>
  );
}

