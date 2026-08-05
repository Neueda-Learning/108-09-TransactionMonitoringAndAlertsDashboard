import { useMemo, useState } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime, formatMoney, toDateTimeInputValue } from '../utils/formatters';

const STATUS_COLORS = ['#00c48c', '#f59e0b', '#f43f5e'];
const TYPE_COLORS = ['#f43f5e', '#00c48c'];

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#162040', border: '1px solid #263660',
        borderRadius: 10, padding: '10px 14px', color: '#e8edf8', fontSize: 13
      }}>
        {label && <div style={{ color: '#6b7da8', marginBottom: 4, fontSize: 11, textTransform: 'uppercase' }}>{label}</div>}
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

const defaultForm = {
  transactionId: '',
  accountId: '',
  payeeId: '',
  payeeName: '',
  amount: '',
  currency: 'INR',
  transactionType: 'DEBIT',
  transactionTime: '',
  description: '',
  status: 'COMPLETED'
};

function normalizePayload(formState) {
  return {
    ...formState,
    amount: Number(formState.amount),
    transactionTime: formState.transactionTime
  };
}

export default function TransactionsPage({
  transactions,
  loading,
  error,
  onCreate,
  onUpdate,
  onDelete,
  onNotify
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [accountFilter, setAccountFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState(defaultForm);
  const [editingTransactionId, setEditingTransactionId] = useState(null);

  const accounts = useMemo(
    () => Array.from(new Set(transactions.map((tx) => tx.accountId))).filter(Boolean),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const queryMatch =
        tx.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.payeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.payeeName?.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilter === 'ALL' || tx.status === statusFilter;
      const accountMatch = !accountFilter || tx.accountId === accountFilter;

      return queryMatch && statusMatch && accountMatch;
    });
  }, [transactions, searchTerm, statusFilter, accountFilter]);

  function resetForm() {
    setFormState(defaultForm);
    setEditingTransactionId(null);
  }

  function startEdit(tx) {
    setEditingTransactionId(tx.transactionId);
    onNotify?.(`Editing transaction ${tx.transactionId}.`, 'info');
    setFormState({
      transactionId: tx.transactionId || '',
      accountId: tx.accountId || '',
      payeeId: tx.payeeId || '',
      payeeName: tx.payeeName || '',
      amount: tx.amount ?? '',
      currency: tx.currency || 'INR',
      transactionType: tx.transactionType || 'DEBIT',
      transactionTime: toDateTimeInputValue(tx.transactionTime),
      description: tx.description || '',
      status: tx.status || 'COMPLETED'
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingTransactionId) {
        await onUpdate(editingTransactionId, normalizePayload(formState));
      } else {
        await onCreate(normalizePayload(formState));
      }

      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  }

  // Chart data
  const statusDistribution = useMemo(() => {
    const counts = { COMPLETED: 0, PENDING: 0, FAILED: 0 };
    transactions.forEach((tx) => { if (counts[tx.status] !== undefined) counts[tx.status]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const typeDistribution = useMemo(() => {
    const counts = { DEBIT: 0, CREDIT: 0 };
    transactions.forEach((tx) => { if (counts[tx.transactionType] !== undefined) counts[tx.transactionType]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const amountByDay = useMemo(() => {
    const map = {};
    transactions.forEach((tx) => {
      if (!tx.transactionTime) return;
      const date = new Date(tx.transactionTime);
      const key = `${date.getMonth() + 1}/${date.getDate()}`;
      if (!map[key]) map[key] = { date: key, amount: 0 };
      map[key].amount += Number(tx.amount || 0);
    });
    return Object.values(map).slice(-8);
  }, [transactions]);

  const totalVolume = useMemo(() => transactions.reduce((s, tx) => s + Number(tx.amount || 0), 0), [transactions]);
  const completedCount = useMemo(() => transactions.filter((tx) => tx.status === 'COMPLETED').length, [transactions]);

  return (
    <section>
      <PageHeader
        title="Transactions"
        subtitle="Record transactions and search/filter historic events"
      />

      {error ? <div className="error-box">⚠ {error}</div> : null}

      {/* ── KPI CARDS ── */}
      <div className="card-grid">
        <article className="card stat-card-primary">
          <div className="card-icon" style={{ background: 'rgba(79,126,255,0.15)', color: '#4f7eff' }}>⬡</div>
          <h3>Total Transactions</h3>
          <strong>{transactions.length}</strong>
          <div className="card-trend">All records</div>
        </article>
        <article className="card stat-card-success">
          <div className="card-icon" style={{ background: 'rgba(0,196,140,0.15)', color: '#00c48c' }}>✓</div>
          <h3>Completed</h3>
          <strong>{completedCount}</strong>
          <div className="card-trend" style={{ color: '#00c48c' }}>
            {transactions.length > 0 ? `${((completedCount / transactions.length) * 100).toFixed(0)}% success` : '—'}
          </div>
        </article>
        <article className="card stat-card-primary">
          <div className="card-icon" style={{ background: 'rgba(0,212,255,0.12)', color: '#00d4ff' }}>₹</div>
          <h3>Total Volume</h3>
          <strong style={{ fontSize: 20 }}>{formatMoney(totalVolume, 'INR')}</strong>
          <div className="card-trend">Cumulative</div>
        </article>
        <article className="card stat-card-warning">
          <div className="card-icon" style={{ background: 'rgba(107,125,168,0.15)', color: '#6b7da8' }}>≡</div>
          <h3>Filtered Results</h3>
          <strong>{filteredTransactions.length}</strong>
          <div className="card-trend" style={{ color: '#6b7da8' }}>Current filter</div>
        </article>
      </div>

      {/* ── CHARTS ── */}
      {transactions.length > 0 && (
        <div className="chart-grid">
          <div className="chart-panel" style={{ gridColumn: 'span 2' }}>
            <h3><span className="dot"></span>Daily Transaction Amount</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={amountByDay} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f7eff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4f7eff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,126,255,0.08)" />
                <XAxis dataKey="date" tick={{ fill: '#6b7da8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7da8', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" name="Amount (₹)" stroke="#4f7eff" strokeWidth={2.5} fill="url(#txGrad)" dot={false} activeDot={{ r: 5, fill: '#4f7eff', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-panel">
            <h3><span className="dot" style={{ background: '#00c48c' }}></span>Status Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" nameKey="name">
                  {statusDistribution.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

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
        </div>
      )}

      {/* ── FORM ── */}
      <div className="panel">
        <h2>{editingTransactionId ? 'Edit Transaction' : 'Add Transaction'}</h2>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Transaction ID
            <input
              required
              value={formState.transactionId}
              onChange={(event) => setFormState((prev) => ({ ...prev, transactionId: event.target.value }))}
              disabled={Boolean(editingTransactionId)}
            />
          </label>
          <label>
            Account ID
            <input
              required
              value={formState.accountId}
              onChange={(event) => setFormState((prev) => ({ ...prev, accountId: event.target.value }))}
            />
          </label>
          <label>
            Payee ID
            <input
              required
              value={formState.payeeId}
              onChange={(event) => setFormState((prev) => ({ ...prev, payeeId: event.target.value }))}
            />
          </label>
          <label>
            Payee Name
            <input
              value={formState.payeeName}
              onChange={(event) => setFormState((prev) => ({ ...prev, payeeName: event.target.value }))}
            />
          </label>
          <label>
            Amount
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={formState.amount}
              onChange={(event) => setFormState((prev) => ({ ...prev, amount: event.target.value }))}
            />
          </label>
          <label>
            Currency
            <input
              required
              value={formState.currency}
              onChange={(event) => setFormState((prev) => ({ ...prev, currency: event.target.value }))}
            />
          </label>
          <label>
            Transaction Type
            <select
              value={formState.transactionType}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, transactionType: event.target.value }))
              }
            >
              <option value="DEBIT">DEBIT</option>
              <option value="CREDIT">CREDIT</option>
            </select>
          </label>
          <label>
            Transaction Time
            <input
              required
              type="datetime-local"
              value={formState.transactionTime}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, transactionTime: event.target.value }))
              }
            />
          </label>
          <label>
            Status
            <select
              value={formState.status}
              onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="COMPLETED">COMPLETED</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
            </select>
          </label>
          <label className="col-span-2">
            Description
            <input
              value={formState.description}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>

          <div className="actions-row col-span-2">
            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : editingTransactionId ? 'Update' : 'Add'}
            </button>
            {editingTransactionId ? (
              <button
                className="btn"
                type="button"
                onClick={() => {
                  resetForm();
                  onNotify?.('Transaction edit cancelled.', 'info');
                }}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <article className="panel">
        <h2>Transaction List</h2>

        <div className="filter-row">
          <input
            placeholder="Search transaction ID, payee, payee name, description"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
          </select>
          <select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}>
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading transactions…</span>
          </div>
        ) : null}
        {!loading && filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>No transactions found.</p>
          </div>
        ) : null}

        {!loading && filteredTransactions.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Account</th>
                <th>Payee</th>
                <th>Payee Name</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id || tx.transactionId}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13, color: '#7ab2ff' }}>{tx.transactionId}</td>
                  <td>{tx.accountId}</td>
                  <td style={{ color: '#b0bcd8', fontSize: 13 }}>{tx.payeeId}</td>
                  <td>{tx.payeeName || '-'}</td>
                  <td style={{ fontWeight: 600 }}>{formatMoney(tx.amount, tx.currency || 'USD')}</td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                      background: tx.transactionType === 'DEBIT' ? 'rgba(244,63,94,0.15)' : 'rgba(0,196,140,0.15)',
                      color: tx.transactionType === 'DEBIT' ? '#ff7089' : '#00c48c',
                      border: `1px solid ${tx.transactionType === 'DEBIT' ? 'rgba(244,63,94,0.3)' : 'rgba(0,196,140,0.3)'}`
                    }}>{tx.transactionType}</span>
                  </td>
                  <td>
                    <StatusBadge value={tx.status} />
                  </td>
                  <td style={{ color: '#6b7da8', fontSize: 13 }}>{formatDateTime(tx.transactionTime)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-small" onClick={() => startEdit(tx)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => onDelete(tx.transactionId)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </article>
    </section>
  );
}

