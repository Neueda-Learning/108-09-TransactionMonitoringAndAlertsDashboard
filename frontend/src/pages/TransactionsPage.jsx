import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime, formatMoney, toDateTimeInputValue } from '../utils/formatters';

const defaultForm = {
  transactionId: '',
  accountId: '',
  payeeId: '',
  amount: '',
  currency: 'USD',
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
  onDelete
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
        tx.payeeId?.toLowerCase().includes(searchTerm.toLowerCase());

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
    setFormState({
      transactionId: tx.transactionId || '',
      accountId: tx.accountId || '',
      payeeId: tx.payeeId || '',
      amount: tx.amount ?? '',
      currency: tx.currency || 'USD',
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

      {error ? <div className="error-box">{error}</div> : null}

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
              {isSubmitting ? 'Saving...' : editingTransactionId ? 'Update' : 'Add'}
            </button>
            {editingTransactionId ? (
              <button className="btn" type="button" onClick={resetForm}>
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
            placeholder="Search transaction ID, payee, description"
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

        {loading ? <p>Loading...</p> : null}
        {!loading && filteredTransactions.length === 0 ? <p>No transactions found.</p> : null}

        {!loading && filteredTransactions.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Account</th>
                <th>Payee</th>
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
                  <td>{tx.transactionId}</td>
                  <td>{tx.accountId}</td>
                  <td>{tx.payeeId}</td>
                  <td>{formatMoney(tx.amount, tx.currency || 'USD')}</td>
                  <td>{tx.transactionType}</td>
                  <td>
                    <StatusBadge value={tx.status} />
                  </td>
                  <td>{formatDateTime(tx.transactionTime)}</td>
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

