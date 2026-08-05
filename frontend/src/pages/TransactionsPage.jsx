import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDateTime, formatMoney, toDateTimeInputValue } from '../utils/formatters';

const defaultForm = {
  transactionId: '',
  accountId: '',
  payeeId: '',
  amount: '',
  currency: 'INR',
  transactionType: 'DEBIT',
  transactionTime: '',
  description: '',
  status: 'COMPLETED'
};

const defaultFilters = {
  query: '',
  accountId: '',
  transactionType: 'ALL',
  status: 'ALL',
  amountMin: '',
  amountMax: '',
  dateFrom: '',
  dateTo: ''
};

const statusOptions = ['ALL', 'COMPLETED', 'PENDING', 'FAILED'];

const sortableColumns = [
  { key: 'transactionId', label: 'Transaction ID' },
  { key: 'accountId', label: 'Account' },
  { key: 'payeeId', label: 'Payee' },
  { key: 'amount', label: 'Amount' },
  { key: 'transactionType', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'transactionTime', label: 'Time' }
];

function normalizePayload(formState) {
  return {
    ...formState,
    amount: Number(formState.amount),
    transactionTime: formState.transactionTime
  };
}

function parseDateAtStartOfDay(value) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`);
}

function parseDateAtEndOfDay(value) {
  if (!value) return null;
  return new Date(`${value}T23:59:59.999`);
}

function getSortValue(transaction, key) {
  if (key === 'amount') return Number(transaction.amount) || 0;

  if (key === 'transactionTime') {
    const timestamp = new Date(transaction.transactionTime).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  return String(transaction[key] || '').toLowerCase();
}

function validateForm(formState) {
  const errors = {};

  const requiredFields = [
    ['transactionId', 'Transaction ID is required.'],
    ['accountId', 'Account ID is required.'],
    ['payeeId', 'Payee ID is required.'],
    ['currency', 'Currency is required.'],
    ['transactionType', 'Transaction type is required.'],
    ['transactionTime', 'Transaction time is required.'],
    ['status', 'Status is required.']
  ];

  requiredFields.forEach(([field, message]) => {
    if (!String(formState[field] || '').trim()) {
      errors[field] = message;
    }
  });

  if (String(formState.amount).trim() === '') {
    errors.amount = 'Amount is required.';
  } else {
    const amount = Number(formState.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      errors.amount = 'Amount must be greater than 0.';
    }
  }

  if (formState.transactionTime) {
    const transactionDate = new Date(formState.transactionTime);
    if (Number.isNaN(transactionDate.getTime())) {
      errors.transactionTime = 'Enter a valid transaction datetime.';
    }
  }

  return errors;
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export default function TransactionsPage({
  transactions,
  loading,
  error,
  onRetry,
  onCreate,
  onUpdate,
  onDelete
}) {
  const [filters, setFilters] = useState(defaultFilters);
  const [sortConfig, setSortConfig] = useState({ key: 'transactionTime', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [preEditFormState, setPreEditFormState] = useState(defaultForm);

  const [pendingDeleteTransaction, setPendingDeleteTransaction] = useState(null);
  const [copiedTransactionId, setCopiedTransactionId] = useState('');

  const accounts = useMemo(
    () => Array.from(new Set(transactions.map((tx) => tx.accountId))).filter(Boolean),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const query = filters.query.toLowerCase();
    const amountMin = filters.amountMin === '' ? null : Number(filters.amountMin);
    const amountMax = filters.amountMax === '' ? null : Number(filters.amountMax);
    const dateFrom = parseDateAtStartOfDay(filters.dateFrom);
    const dateTo = parseDateAtEndOfDay(filters.dateTo);

    return transactions.filter((tx) => {
      const queryMatch =
        !query ||
        tx.transactionId?.toLowerCase().includes(query) ||
        tx.description?.toLowerCase().includes(query) ||
        tx.payeeId?.toLowerCase().includes(query);

      const statusMatch = filters.status === 'ALL' || tx.status === filters.status;
      const accountMatch = !filters.accountId || tx.accountId === filters.accountId;
      const typeMatch = filters.transactionType === 'ALL' || tx.transactionType === filters.transactionType;

      const amountValue = Number(tx.amount);
      const minAmountMatch = amountMin === null || (!Number.isNaN(amountValue) && amountValue >= amountMin);
      const maxAmountMatch = amountMax === null || (!Number.isNaN(amountValue) && amountValue <= amountMax);

      const transactionDate = new Date(tx.transactionTime);
      const hasValidDate = !Number.isNaN(transactionDate.getTime());
      const startDateMatch = !dateFrom || (hasValidDate && transactionDate >= dateFrom);
      const endDateMatch = !dateTo || (hasValidDate && transactionDate <= dateTo);

      return (
        queryMatch &&
        statusMatch &&
        accountMatch &&
        typeMatch &&
        minAmountMatch &&
        maxAmountMatch &&
        startDateMatch &&
        endDateMatch
      );
    });
  }, [transactions, filters]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((left, right) => {
      const leftValue = getSortValue(left, sortConfig.key);
      const rightValue = getSortValue(right, sortConfig.key);

      let comparison = 0;
      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        comparison = leftValue - rightValue;
      } else {
        comparison = String(leftValue).localeCompare(String(rightValue));
      }

      return sortConfig.direction === 'asc' ? comparison : comparison * -1;
    });
  }, [filteredTransactions, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / pageSize));

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedTransactions.slice(startIndex, startIndex + pageSize);
  }, [sortedTransactions, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function resetForm() {
    setFormState(defaultForm);
    setFormErrors({});
    setEditingTransactionId(null);
  }

  function restorePreEditForm() {
    setFormState(preEditFormState);
    setFormErrors({});
    setEditingTransactionId(null);
  }

  function clearFilters() {
    setFilters(defaultFilters);
    setCurrentPage(1);
  }

  function handleFieldChange(field, value) {
    setFormState((previous) => ({ ...previous, [field]: value }));

    if (formErrors[field]) {
      setFormErrors((previous) => {
        const next = { ...previous };
        delete next[field];
        return next;
      });
    }
  }

  function handleFilterChange(field, value) {
    setFilters((previous) => ({ ...previous, [field]: value }));
  }

  function toggleSort(columnKey) {
    setSortConfig((previous) => {
      if (previous.key === columnKey) {
        return {
          key: columnKey,
          direction: previous.direction === 'asc' ? 'desc' : 'asc'
        };
      }

      return { key: columnKey, direction: 'asc' };
    });
  }

  function sortLabel(columnKey) {
    if (sortConfig.key !== columnKey) return 'Sort';
    return sortConfig.direction === 'asc' ? 'Sort ascending' : 'Sort descending';
  }

  function startEdit(transaction) {
    if (!editingTransactionId) {
      setPreEditFormState(formState);
    }

    const nextId = transaction.transactionId || null;
    if (!nextId) return;

    setEditingTransactionId(nextId);
    setFormState({
      transactionId: transaction.transactionId || '',
      accountId: transaction.accountId || '',
      payeeId: transaction.payeeId || '',
      amount: transaction.amount ?? '',
      currency: transaction.currency || 'INR',
      transactionType: transaction.transactionType || 'DEBIT',
      transactionTime: toDateTimeInputValue(transaction.transactionTime),
      description: transaction.description || '',
      status: transaction.status || 'COMPLETED'
    });
    setFormErrors({});
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateForm(formState);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

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

  async function handleDeleteConfirm() {
    if (!pendingDeleteTransaction?.transactionId) return;

    await onDelete(pendingDeleteTransaction.transactionId);

    if (pendingDeleteTransaction.transactionId === editingTransactionId) {
      restorePreEditForm();
    }

    setPendingDeleteTransaction(null);
  }

  async function handleCopyTransactionId(transactionId) {
    if (!transactionId) return;

    try {
      await copyTextToClipboard(transactionId);
      setCopiedTransactionId(transactionId);
      window.setTimeout(() => {
        setCopiedTransactionId((current) => (current === transactionId ? '' : current));
      }, 1200);
    } catch {
      setCopiedTransactionId('');
    }
  }

  return (
    <section>
      <PageHeader
        title="Transactions"
        subtitle="Record transactions and search/filter historic events"
      />

      {error ? (
        <ErrorState message="Unable to load transactions." error={error} onRetry={onRetry} />
      ) : null}

      <div className="panel">
        <h2>{editingTransactionId ? 'Edit Transaction' : 'Add Transaction'}</h2>

        {editingTransactionId ? (
          <div className="editing-banner" role="status" aria-live="polite">
            <strong>Editing Transaction {editingTransactionId}</strong>
            <span>Changes are local until you save.</span>
          </div>
        ) : null}

        <form className="form-grid" onSubmit={handleSubmit} noValidate>
          <fieldset className="form-section col-span-2">
            <legend>Identity</legend>
            <div className="form-section-grid">
              <label>
                Transaction ID
                <input
                  value={formState.transactionId}
                  onChange={(event) => handleFieldChange('transactionId', event.target.value)}
                  disabled={Boolean(editingTransactionId)}
                  aria-invalid={Boolean(formErrors.transactionId)}
                />
                {formErrors.transactionId ? <span className="form-error">{formErrors.transactionId}</span> : null}
              </label>

              <label>
                Account ID
                <input
                  value={formState.accountId}
                  onChange={(event) => handleFieldChange('accountId', event.target.value)}
                  aria-invalid={Boolean(formErrors.accountId)}
                />
                {formErrors.accountId ? <span className="form-error">{formErrors.accountId}</span> : null}
              </label>

              <label>
                Payee ID
                <input
                  value={formState.payeeId}
                  onChange={(event) => handleFieldChange('payeeId', event.target.value)}
                  aria-invalid={Boolean(formErrors.payeeId)}
                />
                {formErrors.payeeId ? <span className="form-error">{formErrors.payeeId}</span> : null}
              </label>
            </div>
          </fieldset>

          <fieldset className="form-section col-span-2">
            <legend>Payment Details</legend>
            <div className="form-section-grid">
              <label>
                Amount
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formState.amount}
                  onChange={(event) => handleFieldChange('amount', event.target.value)}
                  aria-invalid={Boolean(formErrors.amount)}
                />
                {formErrors.amount ? <span className="form-error">{formErrors.amount}</span> : null}
              </label>

              <label>
                Currency
                <input
                  value={formState.currency}
                  onChange={(event) => handleFieldChange('currency', event.target.value)}
                  aria-invalid={Boolean(formErrors.currency)}
                />
                {formErrors.currency ? <span className="form-error">{formErrors.currency}</span> : null}
              </label>

              <label>
                Transaction Type
                <select
                  value={formState.transactionType}
                  onChange={(event) => handleFieldChange('transactionType', event.target.value)}
                  aria-invalid={Boolean(formErrors.transactionType)}
                >
                  <option value="DEBIT">DEBIT</option>
                  <option value="CREDIT">CREDIT</option>
                </select>
                {formErrors.transactionType ? (
                  <span className="form-error">{formErrors.transactionType}</span>
                ) : null}
              </label>
            </div>
          </fieldset>

          <fieldset className="form-section col-span-2">
            <legend>Metadata</legend>
            <div className="form-section-grid">
              <label>
                Transaction Time
                <input
                  type="datetime-local"
                  value={formState.transactionTime}
                  onChange={(event) => handleFieldChange('transactionTime', event.target.value)}
                  aria-invalid={Boolean(formErrors.transactionTime)}
                />
                {formErrors.transactionTime ? (
                  <span className="form-error">{formErrors.transactionTime}</span>
                ) : null}
              </label>

              <label className="col-span-2">
                Description
                <input
                  value={formState.description}
                  onChange={(event) => handleFieldChange('description', event.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="form-section col-span-2">
            <legend>Status</legend>
            <div className="form-section-grid">
              <label>
                Status
                <select
                  value={formState.status}
                  onChange={(event) => handleFieldChange('status', event.target.value)}
                  aria-invalid={Boolean(formErrors.status)}
                >
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                </select>
                {formErrors.status ? <span className="form-error">{formErrors.status}</span> : null}
              </label>
            </div>
          </fieldset>

          <div className="actions-row col-span-2">
            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingTransactionId ? 'Update' : 'Add'}
            </button>
            {editingTransactionId ? (
              <button className="btn btn-secondary transaction-reset-btn" type="button" onClick={restorePreEditForm}>
                Cancel and Restore Previous Draft
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
            value={filters.query}
            onChange={(event) => handleFilterChange('query', event.target.value)}
            aria-label="Search transactions by ID, payee, or description"
          />

          <select
            value={filters.accountId}
            onChange={(event) => handleFilterChange('accountId', event.target.value)}
            aria-label="Filter transactions by account"
          >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </select>

          <select
            value={filters.transactionType}
            onChange={(event) => handleFilterChange('transactionType', event.target.value)}
            aria-label="Filter transactions by type"
          >
            <option value="ALL">All Types</option>
            <option value="DEBIT">DEBIT</option>
            <option value="CREDIT">CREDIT</option>
          </select>

          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Min amount"
            value={filters.amountMin}
            onChange={(event) => handleFilterChange('amountMin', event.target.value)}
            aria-label="Filter transactions by minimum amount"
          />

          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Max amount"
            value={filters.amountMax}
            onChange={(event) => handleFilterChange('amountMax', event.target.value)}
            aria-label="Filter transactions by maximum amount"
          />

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => handleFilterChange('dateFrom', event.target.value)}
            aria-label="Filter transactions from date"
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => handleFilterChange('dateTo', event.target.value)}
            aria-label="Filter transactions to date"
          />
        </div>

        <div className="status-chip-row" role="group" aria-label="Status quick filters">
          {statusOptions.map((status) => {
            const isActive = filters.status === status;
            return (
              <button
                key={status}
                type="button"
                className={`status-chip ${isActive ? 'status-chip-active' : ''}`}
                onClick={() => handleFilterChange('status', status)}
              >
                {status === 'ALL' ? 'All statuses' : status}
              </button>
            );
          })}
        </div>

        <div className="list-toolbar">
          <p className="results-counter">{sortedTransactions.length.toLocaleString()} results</p>
          <div className="list-toolbar-actions">
            <label>
              Rows per page
              <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </label>
            <button className="btn btn-secondary" type="button" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>

        {loading ? <SkeletonLoader rows={6} rowHeight={18} /> : null}
        {!loading && sortedTransactions.length === 0 ? (
          <EmptyState
            icon={<span aria-hidden="true">[?]</span>}
            message="No transactions found."
            actionLabel="Reset Filters"
            onAction={clearFilters}
          />
        ) : null}

        {!loading && sortedTransactions.length > 0 ? (
          <>
            <div className="table-container table-container--responsive transactions-table-container">
              <table className="data-table data-table--sticky-first-column transactions-table">
                <caption className="sr-only">Transactions table</caption>
                <thead>
                  <tr>
                    {sortableColumns.map(({ key, label }) => (
                      <th
                        key={key}
                        scope="col"
                        className={sortConfig.key === key ? 'sortable-th sortable-th--active' : 'sortable-th'}
                        aria-sort={
                          sortConfig.key === key
                            ? sortConfig.direction === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                      >
                        <button
                          type="button"
                          className="th-button"
                          onClick={() => toggleSort(key)}
                          aria-label={`${sortLabel(key)} by ${label}`}
                        >
                          {label}
                          <span className="sort-icon" aria-hidden="true">
                            {sortConfig.key === key ? (sortConfig.direction === 'asc' ? ' ^' : ' v') : ' <> '}
                          </span>
                        </button>
                      </th>
                    ))}
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx.id || tx.transactionId}>
                      <td data-label="Transaction ID">
                        <div className="tx-id-cell">
                          <span>{tx.transactionId}</span>
                          <button
                            type="button"
                            className="copy-id-btn"
                            title="Copy transaction ID"
                            aria-label={`Copy transaction ID ${tx.transactionId}`}
                            onClick={() => handleCopyTransactionId(tx.transactionId)}
                          >
                            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
                              <path
                                d="M5 2.5A1.5 1.5 0 0 1 6.5 1h6A1.5 1.5 0 0 1 14 2.5v8A1.5 1.5 0 0 1 12.5 12h-6A1.5 1.5 0 0 1 5 10.5zm1.5-.5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5z"
                                fill="currentColor"
                              />
                              <path
                                d="M2.5 4A1.5 1.5 0 0 0 1 5.5v8A1.5 1.5 0 0 0 2.5 15h6A1.5 1.5 0 0 0 10 13.5V13H9v.5a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5H3V4z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                          {copiedTransactionId === tx.transactionId ? (
                            <span className="copy-feedback" aria-live="polite">
                              Copied
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td data-label="Account">{tx.accountId}</td>
                      <td data-label="Payee">{tx.payeeId}</td>
                      <td data-label="Amount">{formatMoney(tx.amount, tx.currency || 'USD')}</td>
                      <td data-label="Type">{tx.transactionType}</td>
                      <td data-label="Status">
                        <StatusBadge value={tx.status} />
                      </td>
                      <td data-label="Time">{formatDateTime(tx.transactionTime)}</td>
                      <td data-label="Actions">
                        <div className="table-actions">
                          <button className="btn btn-small" type="button" onClick={() => startEdit(tx)}>
                            Edit
                          </button>
                          <button
                            className="btn btn-small btn-danger"
                            type="button"
                            onClick={() => setPendingDeleteTransaction(tx)}
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

            <div className="pagination-row" role="navigation" aria-label="Transactions pagination">
              <button
                className="btn btn-secondary btn-small"
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <p>
                Page {currentPage} of {totalPages}
              </p>
              <button
                className="btn btn-secondary btn-small"
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </article>

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteTransaction)}
        title="Delete transaction"
        message={
          pendingDeleteTransaction
            ? `Delete transaction ${pendingDeleteTransaction.transactionId}? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPendingDeleteTransaction(null)}
        tone="danger"
      />
    </section>
  );
}

