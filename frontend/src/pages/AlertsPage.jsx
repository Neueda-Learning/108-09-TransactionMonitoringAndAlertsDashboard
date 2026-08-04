import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { ALERT_STATUS } from '../constants';
import { canTransitionAlert, deriveAlertsFromData } from '../utils/alerts';
import { formatDateTime } from '../utils/formatters';

function enrichAlerts(baseAlerts, updates) {
  const updatesMap = new Map(updates.map((item) => [item.id, item]));

  return baseAlerts.map((alert) => {
    const update = updatesMap.get(alert.id);
    if (!update) {
      return alert;
    }

    return {
      ...alert,
      ...update,
      history: update.history || alert.history
    };
  });
}

export default function AlertsPage({ transactions, rules }) {
  const [localUpdates, setLocalUpdates] = useState([]);

  const derivedAlerts = useMemo(
    () => deriveAlertsFromData(transactions, rules),
    [transactions, rules]
  );

  const alerts = useMemo(
    () => enrichAlerts(derivedAlerts, localUpdates),
    [derivedAlerts, localUpdates]
  );

  const activeAlerts = alerts.filter(
    (alert) => ![ALERT_STATUS.CLOSED, ALERT_STATUS.DISMISSED].includes(alert.status)
  );

  function transitionAlert(alert, targetStatus) {
    if (!canTransitionAlert(alert.status, targetStatus)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const updated = {
      ...alert,
      status: targetStatus,
      updatedAt: timestamp,
      history: [
        ...(alert.history || []),
        {
          status: targetStatus,
          changedAt: timestamp,
          note: 'Status updated from dashboard'
        }
      ]
    };

    setLocalUpdates((prev) => [...prev.filter((entry) => entry.id !== alert.id), updated]);
  }

  return (
    <section>
      <PageHeader
        title="Alerts"
        subtitle="Live backend alert endpoints are not available yet; this page uses derived alerts for now"
      />

      <div className="card-grid">
        <article className="card">
          <h3>Total Derived Alerts</h3>
          <strong>{alerts.length}</strong>
        </article>
        <article className="card">
          <h3>Active Alerts</h3>
          <strong>{activeAlerts.length}</strong>
        </article>
      </div>

      <article className="panel">
        <h2>Active Alerts</h2>

        {activeAlerts.length === 0 ? (
          <p>No alerts currently match active amount-threshold rules.</p>
        ) : (
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
                  <td>{alert.transactionId}</td>
                  <td>{formatDateTime(alert.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-small"
                        disabled={!canTransitionAlert(alert.status, ALERT_STATUS.ACKNOWLEDGED)}
                        onClick={() => transitionAlert(alert, ALERT_STATUS.ACKNOWLEDGED)}
                      >
                        Acknowledge
                      </button>
                      <button
                        className="btn btn-small"
                        disabled={!canTransitionAlert(alert.status, ALERT_STATUS.INVESTIGATING)}
                        onClick={() => transitionAlert(alert, ALERT_STATUS.INVESTIGATING)}
                      >
                        Investigate
                      </button>
                      <button
                        className="btn btn-small"
                        disabled={!canTransitionAlert(alert.status, ALERT_STATUS.CLOSED)}
                        onClick={() => transitionAlert(alert, ALERT_STATUS.CLOSED)}
                      >
                        Close
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        disabled={!canTransitionAlert(alert.status, ALERT_STATUS.DISMISSED)}
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
        )}
      </article>

      <article className="panel">
        <h2>Alert History</h2>
        {alerts.length === 0 ? (
          <p>No history yet.</p>
        ) : (
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
        )}
      </article>
    </section>
  );
}

