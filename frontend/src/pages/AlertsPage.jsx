import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { useToast } from '../components/Toast';
import { ALERT_STATUS } from '../constants';
import { alertsApi } from '../api/alertsApi';
import { canTransitionAlert } from '../utils/alerts';
import { formatDateTime } from '../utils/formatters';
import SeverityDonutChart from '../components/charts/SeverityDonutChart';
import AlertLifecycleFunnel from '../components/charts/AlertLifecycleFunnel';

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
  const [severityFilter, setSeverityFilter] = useState('');
  const { toastSuccess, toastError } = useToast();

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

  const filteredActiveAlerts = useMemo(
    () =>
      severityFilter
        ? activeAlerts.filter((a) => (a.severity || '').toUpperCase() === severityFilter)
        : activeAlerts,
    [activeAlerts, severityFilter]
  );

  function handleSeveritySegmentClick(severity) {
    setSeverityFilter((prev) => (prev === severity ? '' : severity));
  }

  async function transitionAlert(alert, targetStatus) {
    if (!canTransitionAlert(alert.status, targetStatus)) {
      return;
    }

    setIsUpdatingStatus(true);

    try {
      await alertsApi.updateStatus(alert.id, targetStatus);
      await fetchAlerts();
      toastSuccess(`Alert ${alert.alertId} moved to ${targetStatus}.`);
    } catch (err) {
      const failureMessage = err.message || 'Failed to update alert status.';
      setError(failureMessage);
      toastError(failureMessage, { details: String(err) });
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

      {error ? (
        <ErrorState message="Unable to load alerts." error={error} onRetry={fetchAlerts} />
      ) : null}

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

      <div className="card-grid">
        <article className="card">
          <h3>Alerts by Severity</h3>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--muted)', margin: '0 0 8px' }}>
            Click a segment to filter active alerts below
            {severityFilter && (
              <button
                className="btn btn-small"
                style={{ marginLeft: 8 }}
                onClick={() => setSeverityFilter('')}
              >
                Clear ({severityFilter})
              </button>
            )}
          </p>
          <SeverityDonutChart items={alerts} onSegmentClick={handleSeveritySegmentClick} />
        </article>
        <article className="card">
          <h3>Alert Lifecycle</h3>
          <AlertLifecycleFunnel alerts={alerts} />
        </article>
      </div>

      <article className="panel">
        <h2>Active Alerts</h2>
        {severityFilter && (
          <div className="filter-row" style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--muted)' }}>
              Filtered by severity: <strong>{severityFilter}</strong>
            </span>
            <button className="btn btn-small" onClick={() => setSeverityFilter('')}>
              Clear filter
            </button>
          </div>
        )}

        {loading ? <SkeletonLoader rows={6} rowHeight={18} /> : null}
        {!loading && filteredActiveAlerts.length === 0 ? (
          <EmptyState
            icon={<span aria-hidden="true">[i]</span>}
            message={activeAlerts.length === 0 ? 'No active alerts from backend.' : 'No active alerts match the current severity filter.'}
            actionLabel={activeAlerts.length === 0 ? 'Refresh Now' : ''}
            onAction={activeAlerts.length === 0 ? fetchAlerts : undefined}
          />
        ) : null}

        {!loading && filteredActiveAlerts.length > 0 ? (
          <div className="table-container">
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
                {filteredActiveAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td data-label="Alert ID">{alert.alertId}</td>
                    <td data-label="Rule">{alert.ruleName}</td>
                    <td data-label="Severity">
                      <StatusBadge value={alert.severity} />
                    </td>
                    <td data-label="Status">
                      <StatusBadge value={alert.status} />
                    </td>
                    <td data-label="Transaction">{alert.transactionRef}</td>
                    <td data-label="Created">{formatDateTime(alert.createdAt)}</td>
                    <td data-label="Actions">
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
          </div>
        ) : null}
      </article>

      <article className="panel">
        <h2>Alert History</h2>
        {loading ? <SkeletonLoader rows={4} rowHeight={18} /> : null}
        {!loading && alerts.length === 0 ? (
          <EmptyState
            icon={<span aria-hidden="true">[i]</span>}
            message="No history yet."
            actionLabel="Refresh Now"
            onAction={fetchAlerts}
          />
        ) : null}

        {!loading && alerts.length > 0 ? (
          <div className="table-container">
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
                    <td data-label="Alert ID">{alert.alertId}</td>
                    <td data-label="Status">
                      <StatusBadge value={alert.status} />
                    </td>
                    <td data-label="Updated At">{formatDateTime(alert.updatedAt)}</td>
                    <td data-label="Reason">{alert.reason}</td>
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
