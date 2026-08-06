import './App.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import RulesPage from './pages/RulesPage';
import AlertsPage from './pages/AlertsPage';
import { transactionsApi } from './api/transactionsApi';
import { rulesApi } from './api/rulesApi';

const NOTIFICATION_TIMEOUT_MS = 3200;

function App() {
  const [transactions, setTransactions] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const notificationTimersRef = useRef(new Map());

  const dismissNotification = useCallback((notificationId) => {
    const timerId = notificationTimersRef.current.get(notificationId);

    if (timerId) {
      clearTimeout(timerId);
      notificationTimersRef.current.delete(notificationId);
    }

    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== notificationId)
    );
  }, []);

  const showNotification = useCallback(
    (message, variant = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setNotifications((currentNotifications) =>
        [...currentNotifications, { id, message, variant }].slice(-4)
      );

      const timerId = setTimeout(() => dismissNotification(id), NOTIFICATION_TIMEOUT_MS);
      notificationTimersRef.current.set(id, timerId);
    },
    [dismissNotification]
  );

  useEffect(() => {
    const timers = notificationTimersRef.current;

    return () => {
      timers.forEach((timerId) => clearTimeout(timerId));
      timers.clear();
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [transactionsData, rulesData] = await Promise.all([
        transactionsApi.getAll(),
        rulesApi.getAll()
      ]);

      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setRules(Array.isArray(rulesData) ? rulesData : []);
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
      showNotification(`Transaction ${payload.transactionId} created.`, 'success');
    } catch (err) {
      setError(err.message || 'Failed to create transaction.');
      throw err;
    }
  }

  async function handleUpdateTransaction(transactionId, payload) {
    setError('');
    try {
      await transactionsApi.update(transactionId, payload);
      await loadData();
      showNotification(`Transaction ${transactionId} updated.`, 'success');
    } catch (err) {
      setError(err.message || 'Failed to update transaction.');
      throw err;
    }
  }

  async function handleDeleteTransaction(transactionId) {
    setError('');
    try {
      await transactionsApi.remove(transactionId);
      await loadData();
      showNotification(`Transaction ${transactionId} deleted.`, 'success');
    } catch (err) {
      setError(err.message || 'Failed to delete transaction.');
    }
  }

  async function handleCreateRule(payload) {
    setError('');
    try {
      await rulesApi.create(payload);
      await loadData();
      showNotification(`Rule ${payload.ruleName} created.`, 'success');
    } catch (err) {
      setError(err.message || 'Failed to create rule.');
      throw err;
    }
  }

  async function handleUpdateRule(id, payload) {
    setError('');
    try {
      await rulesApi.update(id, payload);
      await loadData();
      showNotification(`Rule ${payload.ruleName} updated.`, 'success');
    } catch (err) {
      setError(err.message || 'Failed to update rule.');
      throw err;
    }
  }

  async function handleDeleteRule(id) {
    setError('');
    try {
      await rulesApi.remove(id);
      await loadData();
      showNotification(`Rule ${id} deleted.`, 'success');
    } catch (err) {
      setError(err.message || 'Failed to delete rule.');
    }
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <NavBar />

        <div className="notification-stack" aria-live="polite" aria-atomic="true">
          {notifications.map((notification) => (
            <div key={notification.id} className={`notification notification-${notification.variant}`} role="status">
              <div className="notification-body">
                <span className="notification-icon" aria-hidden="true">
                  {notification.variant === 'success' ? '✓' : notification.variant === 'error' ? '!' : 'i'}
                </span>
                <span className="notification-message">{notification.message}</span>
              </div>
              <button
                type="button"
                className="notification-close"
                aria-label="Dismiss notification"
                onClick={() => dismissNotification(notification.id)}
              >
                ×
              </button>
            </div>
          ))}
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
                  onCreate={handleCreateTransaction}
                  onUpdate={handleUpdateTransaction}
                  onDelete={handleDeleteTransaction}
                  onNotify={showNotification}
                />
              }
            />
            <Route
              path="/rules"
              element={
                <RulesPage
                  rules={rules}
                  loading={loading}
                  error={error}
                  onCreate={handleCreateRule}
                  onUpdate={handleUpdateRule}
                  onDelete={handleDeleteRule}
                  onNotify={showNotification}
                />
              }
            />
            <Route
              path="/alerts"
              element={
                <AlertsPage
                  transactions={transactions}
                  rules={rules}
                  onNotify={showNotification}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
