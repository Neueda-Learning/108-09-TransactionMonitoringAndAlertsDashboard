import './App.css';
import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import RulesPage from './pages/RulesPage';
import AlertsPage from './pages/AlertsPage';
import { transactionsApi } from './api/transactionsApi';
import { rulesApi } from './api/rulesApi';
import { alertsApi } from './api/alertsApi';
import { useToast } from './components/Toast';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [rules, setRules] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toastSuccess, toastError } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [transactionsData, rulesData, alertsData] = await Promise.all([
        transactionsApi.getAll(),
        rulesApi.getAll(),
        alertsApi.getAll().catch(() => [])
      ]);

      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setRules(Array.isArray(rulesData) ? rulesData : []);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateTransaction(payload) {
    setError('');
    try {
      await transactionsApi.create(payload);
      await loadData();
      toastSuccess('Transaction created successfully.');
    } catch (err) {
      const failureMessage = err.message || 'Failed to create transaction.';
      setError(failureMessage);
      toastError(failureMessage, { details: String(err) });
      throw err;
    }
  }

  async function handleUpdateTransaction(transactionId, payload) {
    setError('');
    try {
      await transactionsApi.update(transactionId, payload);
      await loadData();
      toastSuccess('Transaction updated successfully.');
    } catch (err) {
      const failureMessage = err.message || 'Failed to update transaction.';
      setError(failureMessage);
      toastError(failureMessage, { details: String(err) });
      throw err;
    }
  }

  async function handleDeleteTransaction(transactionId) {
    setError('');
    try {
      await transactionsApi.remove(transactionId);
      await loadData();
      toastSuccess('Transaction deleted successfully.');
    } catch (err) {
      const failureMessage = err.message || 'Failed to delete transaction.';
      setError(failureMessage);
      toastError(failureMessage, { details: String(err) });
    }
  }

  async function handleCreateRule(payload) {
    setError('');
    try {
      await rulesApi.create(payload);
      await loadData();
      toastSuccess('Rule created successfully.');
    } catch (err) {
      const failureMessage = err.message || 'Failed to create rule.';
      setError(failureMessage);
      toastError(failureMessage, { details: String(err) });
      throw err;
    }
  }

  async function handleUpdateRule(id, payload) {
    setError('');
    try {
      await rulesApi.update(id, payload);
      await loadData();
      toastSuccess('Rule updated successfully.');
    } catch (err) {
      const failureMessage = err.message || 'Failed to update rule.';
      setError(failureMessage);
      toastError(failureMessage, { details: String(err) });
      throw err;
    }
  }

  async function handleDeleteRule(id) {
    setError('');
    try {
      await rulesApi.remove(id);
      await loadData();
      toastSuccess('Rule deleted successfully.');
    } catch (err) {
      const failureMessage = err.message || 'Failed to delete rule.';
      setError(failureMessage);
      toastError(failureMessage, { details: String(err) });
    }
  }

  const globalStatusMessage = '';

  return (
    <BrowserRouter>
      <div className="app-shell">
        <NavBar />

        <div
          className={`status-strip-slot${globalStatusMessage ? ' is-visible' : ''}`}
          aria-live="polite"
        >
          {globalStatusMessage ? (
            <div className="container status-strip status-strip-error" role="alert">
              {globalStatusMessage}
            </div>
          ) : null}
        </div>

        <main className="container main-content">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  transactions={transactions}
                  rules={rules}
                  loading={loading}
                  error={error}
                  onRetry={loadData}
                />
              }
            />
            <Route
              path="/transactions"
              element={
                <TransactionsPage
                  transactions={transactions}
                  loading={loading}
                  error={error}
                  onRetry={loadData}
                  onCreate={handleCreateTransaction}
                  onUpdate={handleUpdateTransaction}
                  onDelete={handleDeleteTransaction}
                />
              }
            />
            <Route
              path="/rules"
              element={
                <RulesPage
                  rules={rules}
                  alerts={alerts}
                  loading={loading}
                  error={error}
                  onRetry={loadData}
                  onCreate={handleCreateRule}
                  onUpdate={handleUpdateRule}
                  onDelete={handleDeleteRule}
                />
              }
            />
            <Route
              path="/alerts"
              element={<AlertsPage transactions={transactions} rules={rules} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
