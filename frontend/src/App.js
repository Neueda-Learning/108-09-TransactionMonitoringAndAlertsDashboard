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

function App() {
  const [transactions, setTransactions] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    } catch (err) {
      setError(err.message || 'Failed to delete transaction.');
    }
  }

  async function handleCreateRule(payload) {
    setError('');
    try {
      await rulesApi.create(payload);
      await loadData();
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
    } catch (err) {
      setError(err.message || 'Failed to delete rule.');
    }
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <NavBar />

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
