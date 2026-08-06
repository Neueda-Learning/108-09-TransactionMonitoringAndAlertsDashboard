import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime, formatMoney, toDateTimeInputValue } from '../utils/formatters';

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

  return (
    <section>
      <PageHeader
        title="Transactions"
        subtitle="Record transactions and search/filter historic events"
      />

      {error ? <div className="error-box">⚠ {error}</div> : null}

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
              className="tx-datetime-input"
              title="Select local date and time"
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
          <div className="table-wrap">
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
          </div>
        ) : null}
      </article>
    </section>
  );
}

