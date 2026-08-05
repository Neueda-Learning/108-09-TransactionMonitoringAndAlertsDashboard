import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { ALERT_STATUS } from '../constants';
import { alertsApi } from '../api/alertsApi';
import { canTransitionAlert } from '../utils/alerts';
import { formatDateTime } from '../utils/formatters';

const REFRESH_INTERVAL_MS = Number(process.env.REACT_APP_ALERTS_POLL_MS || 3000);

function normalizeAlerts(apiAlerts, transactions, rules) {
  const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
  const transactionsById = new Map(transactions.map((tx) => [tx.id, tx]));

  return (Array.isArray(apiAlerts) ? apiAlerts : [])
    .map((alert) => {
      const linkedRule = rulesById.get(alert.ruleId);
      const linkedTransaction = transactionsById.get(alert.transactionId);

      return {
        ...alert,
        ruleName: linkedRule?.ruleName || `Rule #${alert.ruleId ?? '-'}`,
        ruleType: linkedRule?.ruleType || '-',
        transactionRef: linkedTransaction?.transactionId || alert.transactionId,
        reason:
          linkedRule?.ruleName && linkedTransaction?.transactionId
            ? `${linkedRule.ruleName} triggered by transaction ${linkedTransaction.transactionId}`
            : `Rule ${alert.ruleId ?? '-'} triggered this alert`
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export default function AlertsPage({ transactions, rules }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      setError('');
      const backendAlerts = await alertsApi.getAll();
      setAlerts(normalizeAlerts(backendAlerts, transactions, rules));
    } catch (err) {
      setError(err.message || 'Failed to load alerts from backend API.');
    }
  }, [transactions, rules]);

  useEffect(() => {
    let intervalId;
    let isMounted = true;

    async function loadInitial() {
      setLoading(true);
      try {
        const backendAlerts = await alertsApi.getAll();
        if (isMounted) {
          setAlerts(normalizeAlerts(backendAlerts, transactions, rules));
          setError('');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load alerts from backend API.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    intervalId = setInterval(() => {
      fetchAlerts();
    }, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [fetchAlerts, transactions, rules]);

  const activeAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) => ![ALERT_STATUS.CLOSED, ALERT_STATUS.DISMISSED].includes(alert.status)
      ),
    [alerts]
  );

  async function transitionAlert(alert, targetStatus) {
    if (!canTransitionAlert(alert.status, targetStatus)) {
      return;
    }

    setIsUpdatingStatus(true);

    try {
      await alertsApi.updateStatus(alert.id, targetStatus);
      await fetchAlerts();
    } catch (err) {
      setError(err.message || 'Failed to update alert status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <section>
      <PageHeader
        title="Alerts"
        subtitle={`Realtime backend alerts via /api/alerts (auto-refresh every ${REFRESH_INTERVAL_MS / 1000}s)`}
        action={
          <button className="btn" onClick={fetchAlerts} disabled={loading || isUpdatingStatus}>
            Refresh Now
          </button>
        }
      />

      {error ? <div className="error-box">{error}</div> : null}

      <div className="card-grid">
        <article className="card">
          <h3>Total Alerts</h3>
          <strong>{alerts.length}</strong>
        </article>
        <article className="card">
          <h3>Active Alerts</h3>
          <strong>{activeAlerts.length}</strong>
        </article>
      </div>

      <article className="panel">
        <h2>Active Alerts</h2>

        {loading ? <p>Loading...</p> : null}
        {!loading && activeAlerts.length === 0 ? (
          <p>No active alerts from backend.</p>
        ) : null}

        {!loading && activeAlerts.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Rule</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Transaction</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.alertId}</td>
                  <td>{alert.ruleName}</td>
                  <td>
                    <StatusBadge value={alert.severity} />
                  </td>
                  <td>
                    <StatusBadge value={alert.status} />
                  </td>
                  <td>{alert.transactionRef}</td>
                  <td>{formatDateTime(alert.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-small"
                        disabled={
                          isUpdatingStatus ||
                          !canTransitionAlert(alert.status, ALERT_STATUS.ACKNOWLEDGED)
                        }
                        onClick={() => transitionAlert(alert, ALERT_STATUS.ACKNOWLEDGED)}
                      >
                        Acknowledge
                      </button>
                      <button
                        className="btn btn-small"
                        disabled={
                          isUpdatingStatus ||
                          !canTransitionAlert(alert.status, ALERT_STATUS.INVESTIGATING)
                        }
                        onClick={() => transitionAlert(alert, ALERT_STATUS.INVESTIGATING)}
                      >
                        Investigate
                      </button>
                      <button
                        className="btn btn-small"
                        disabled={
                          isUpdatingStatus ||
                          !canTransitionAlert(alert.status, ALERT_STATUS.CLOSED)
                        }
                        onClick={() => transitionAlert(alert, ALERT_STATUS.CLOSED)}
                      >
                        Close
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        disabled={
                          isUpdatingStatus ||
                          !canTransitionAlert(alert.status, ALERT_STATUS.DISMISSED)
                        }
                        onClick={() => transitionAlert(alert, ALERT_STATUS.DISMISSED)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </article>

      <article className="panel">
        <h2>Alert History</h2>
        {loading ? <p>Loading...</p> : null}
        {!loading && alerts.length === 0 ? <p>No history yet.</p> : null}

        {!loading && alerts.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Status</th>
                <th>Updated At</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={`history-${alert.id}`}>
                  <td>{alert.alertId}</td>
                  <td>
                    <StatusBadge value={alert.status} />
                  </td>
                  <td>{formatDateTime(alert.updatedAt)}</td>
                  <td>{alert.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </article>
    </section>
  );
}
