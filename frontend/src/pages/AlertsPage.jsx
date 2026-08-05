import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { ALERT_STATUS } from '../constants';
import { alertsApi } from '../api/alertsApi';
import { canTransitionAlert } from '../utils/alerts';
import { formatDateTime } from '../utils/formatters';
import SeverityDonutChart from '../components/charts/SeverityDonutChart';
import AlertLifecycleFunnel from '../components/charts/AlertLifecycleFunnel';

const REFRESH_INTERVAL_MS = Number(process.env.REACT_APP_ALERTS_POLL_MS || 3000);
const TAB_ACTIVE_QUEUE = 'ACTIVE_QUEUE';
const TAB_HISTORY = 'HISTORY';

const defaultFilters = {
  status: 'ALL',
  severity: 'ALL',
  ruleType: 'ALL',
  transactionRef: '',
  createdFrom: '',
  createdTo: ''
};

function parseDateTimeInput(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

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
  const [updatingAlertIds, setUpdatingAlertIds] = useState({});
  const [activeTab, setActiveTab] = useState(TAB_ACTIVE_QUEUE);
  const [filters, setFilters] = useState(defaultFilters);
  const [expandedAlertIds, setExpandedAlertIds] = useState(() => new Set());
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [pendingTransition, setPendingTransition] = useState(null);
  const { toastSuccess, toastError } = useToast();

  const fetchAlerts = useCallback(async () => {
    try {
      setError('');
      const backendAlerts = await alertsApi.getAll();
      setAlerts(normalizeAlerts(backendAlerts, transactions, rules));
      setLastRefreshedAt(new Date());
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
          setLastRefreshedAt(new Date());
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

  const transactionReferencesByKey = useMemo(() => {
    const refs = new Map();

    (Array.isArray(transactions) ? transactions : []).forEach((transaction) => {
      const friendlyRef = String(transaction.transactionId || transaction.id || '').trim();
      if (!friendlyRef) return;

      if (transaction.id !== undefined && transaction.id !== null) {
        refs.set(String(transaction.id), friendlyRef);
      }

      refs.set(String(transaction.transactionId), friendlyRef);
    });

    return refs;
  }, [transactions]);

  const decoratedAlerts = useMemo(
    () =>
      alerts.map((alert) => {
        const mappedRefById = transactionReferencesByKey.get(String(alert.transactionId));
        const mappedRefByExisting = transactionReferencesByKey.get(String(alert.transactionRef));
        const transactionReference =
          mappedRefById ||
          mappedRefByExisting ||
          String(alert.transactionRef || alert.transactionId || '-');

        return {
          ...alert,
          transactionReference
        };
      }),
    [alerts, transactionReferencesByKey]
  );

  const statusOptions = useMemo(() => {
    const fromAlerts = decoratedAlerts
      .map((alert) => String(alert.status || '').toUpperCase())
      .filter(Boolean);
    return ['ALL', ...Array.from(new Set(fromAlerts))];
  }, [decoratedAlerts]);

  const severityOptions = useMemo(() => {
    const fromAlerts = decoratedAlerts
      .map((alert) => String(alert.severity || '').toUpperCase())
      .filter(Boolean);
    return ['ALL', ...Array.from(new Set(fromAlerts))];
  }, [decoratedAlerts]);

  const ruleTypeOptions = useMemo(() => {
    const fromAlerts = decoratedAlerts
      .map((alert) => String(alert.ruleType || '').toUpperCase())
      .filter(Boolean);
    return ['ALL', ...Array.from(new Set(fromAlerts))];
  }, [decoratedAlerts]);

  const filteredAlerts = useMemo(() => {
    const createdFrom = parseDateTimeInput(filters.createdFrom);
    const createdTo = parseDateTimeInput(filters.createdTo);
    const transactionRefQuery = filters.transactionRef.trim().toLowerCase();

    return decoratedAlerts.filter((alert) => {
      const normalizedStatus = String(alert.status || '').toUpperCase();
      const normalizedSeverity = String(alert.severity || '').toUpperCase();
      const normalizedRuleType = String(alert.ruleType || '').toUpperCase();
      const createdAtDate = new Date(alert.createdAt);
      const hasCreatedAt = !Number.isNaN(createdAtDate.getTime());

      const statusMatch = filters.status === 'ALL' || normalizedStatus === filters.status;
      const severityMatch = filters.severity === 'ALL' || normalizedSeverity === filters.severity;
      const ruleTypeMatch = filters.ruleType === 'ALL' || normalizedRuleType === filters.ruleType;

      const referenceMatch =
        !transactionRefQuery ||
        alert.transactionReference.toLowerCase().includes(transactionRefQuery);

      const createdFromMatch = !createdFrom || (hasCreatedAt && createdAtDate >= createdFrom);
      const createdToMatch = !createdTo || (hasCreatedAt && createdAtDate <= createdTo);

      return (
        statusMatch &&
        severityMatch &&
        ruleTypeMatch &&
        referenceMatch &&
        createdFromMatch &&
        createdToMatch
      );
    });
  }, [decoratedAlerts, filters]);

  const activeQueueAlerts = useMemo(
    () =>
      filteredAlerts.filter(
        (alert) => ![ALERT_STATUS.CLOSED, ALERT_STATUS.DISMISSED].includes(alert.status)
      ),
    [filteredAlerts]
  );

  const historyAlerts = useMemo(
    () =>
      filteredAlerts.filter((alert) =>
        [ALERT_STATUS.CLOSED, ALERT_STATUS.DISMISSED].includes(alert.status)
      ),
    [filteredAlerts]
  );

  const visibleAlerts = activeTab === TAB_ACTIVE_QUEUE ? activeQueueAlerts : historyAlerts;

  function handleSeveritySegmentClick(severity) {
    setFilters((prev) => ({
      ...prev,
      severity: prev.severity === severity ? 'ALL' : severity
    }));
    setActiveTab(TAB_ACTIVE_QUEUE);
  }

  async function transitionAlert(alert, targetStatus) {
    if (!canTransitionAlert(alert.status, targetStatus)) {
      return;
    }

    setUpdatingAlertIds((previous) => ({
      ...previous,
      [alert.id]: true
    }));

    try {
      await alertsApi.updateStatus(alert.id, targetStatus);
      await fetchAlerts();
      toastSuccess(`Alert ${alert.alertId} moved to ${targetStatus}.`);
    } catch (err) {
      const failureMessage = err.message || 'Failed to update alert status.';
      setError(failureMessage);
      toastError(failureMessage, { details: String(err) });
    } finally {
      setUpdatingAlertIds((previous) => {
        const next = { ...previous };
        delete next[alert.id];
        return next;
      });
    }
  }

  function handleFilterChange(field, value) {
    setFilters((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  function clearFilters() {
    setFilters(defaultFilters);
  }

  function toggleAlertExpansion(alertId) {
    setExpandedAlertIds((previous) => {
      const next = new Set(previous);
      if (next.has(alertId)) {
        next.delete(alertId);
      } else {
        next.add(alertId);
      }
      return next;
    });
  }

  function requestTransition(alert, targetStatus) {
    if (![ALERT_STATUS.CLOSED, ALERT_STATUS.DISMISSED].includes(targetStatus)) {
      transitionAlert(alert, targetStatus);
      return;
    }

    setPendingTransition({ alert, targetStatus });
  }

  async function confirmPendingTransition() {
    if (!pendingTransition) return;
    const transition = pendingTransition;
    setPendingTransition(null);
    await transitionAlert(transition.alert, transition.targetStatus);
  }

  function getAlertTimeline(alert) {
    const explicitHistory = Array.isArray(alert.history) ? alert.history : [];
    if (explicitHistory.length > 0) {
      return [...explicitHistory].sort(
        (left, right) => new Date(right.changedAt || right.updatedAt || 0) - new Date(left.changedAt || left.updatedAt || 0)
      );
    }

    return [
      {
        status: alert.status,
        changedAt: alert.updatedAt || alert.createdAt,
        note: alert.reason || 'No additional history recorded.'
      }
    ];
  }

  return (
    <section>
      <PageHeader
        title="Alerts"
        subtitle={`Realtime backend alerts via /api/alerts (auto-refresh every ${REFRESH_INTERVAL_MS / 1000}s)`}
        action={
          <button className="btn" type="button" onClick={fetchAlerts} disabled={loading}>
            Refresh Now
          </button>
        }
      />

      <div className="alerts-refresh-meta" role="status" aria-live="polite">
        <span className="auto-refresh-indicator">
          <span className="auto-refresh-dot" aria-hidden="true" />
          Auto-refresh on ({REFRESH_INTERVAL_MS / 1000}s)
        </span>
        <span>Last refreshed at {lastRefreshedAt ? formatDateTime(lastRefreshedAt) : '-'}</span>
      </div>

      {error ? (
        <ErrorState message="Unable to load alerts." error={error} onRetry={fetchAlerts} />
      ) : null}

      <section aria-labelledby="alerts-summary-heading">
        <h2 id="alerts-summary-heading" className="sr-only">Alert summary</h2>
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
      </section>

      <section aria-labelledby="alerts-analytics-heading">
        <h2 id="alerts-analytics-heading" className="sr-only">Alert analytics</h2>
        <div className="card-grid">
          <article className="card">
            <h3>Alerts by Severity</h3>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--muted)', margin: '0 0 8px' }}>
              Click a segment to filter active alerts below
              {filters.severity !== 'ALL' && (
                <button
                  className="btn btn-small"
                  type="button"
                  style={{ marginLeft: 8 }}
                  onClick={() => handleFilterChange('severity', 'ALL')}
                >
                  Clear ({filters.severity})
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
      </section>

      <article className="panel">
        <h2>Alert Queue</h2>

        <div className="filter-row alerts-filter-row">
          <select
            value={filters.status}
            onChange={(event) => handleFilterChange('status', event.target.value)}
            aria-label="Filter alerts by status"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'All statuses' : status}
              </option>
            ))}
          </select>

          <select
            value={filters.severity}
            onChange={(event) => handleFilterChange('severity', event.target.value)}
            aria-label="Filter alerts by severity"
          >
            {severityOptions.map((severity) => (
              <option key={severity} value={severity}>
                {severity === 'ALL' ? 'All severities' : severity}
              </option>
            ))}
          </select>

          <select
            value={filters.ruleType}
            onChange={(event) => handleFilterChange('ruleType', event.target.value)}
            aria-label="Filter alerts by rule type"
          >
            {ruleTypeOptions.map((ruleType) => (
              <option key={ruleType} value={ruleType}>
                {ruleType === 'ALL' ? 'All rule types' : ruleType}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Transaction reference"
            value={filters.transactionRef}
            onChange={(event) => handleFilterChange('transactionRef', event.target.value)}
            aria-label="Filter alerts by transaction reference"
          />

          <input
            type="datetime-local"
            value={filters.createdFrom}
            onChange={(event) => handleFilterChange('createdFrom', event.target.value)}
            title="Created from"
            aria-label="Filter alerts created from date and time"
          />

          <input
            type="datetime-local"
            value={filters.createdTo}
            onChange={(event) => handleFilterChange('createdTo', event.target.value)}
            title="Created to"
            aria-label="Filter alerts created to date and time"
          />

          <button className="btn btn-secondary" type="button" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        <div className="alerts-tabs" role="group" aria-label="Alert queue views">
          <button
            type="button"
            aria-pressed={activeTab === TAB_ACTIVE_QUEUE}
            className={`status-chip ${activeTab === TAB_ACTIVE_QUEUE ? 'status-chip-active' : ''}`}
            onClick={() => setActiveTab(TAB_ACTIVE_QUEUE)}
          >
            Active queue <span className="tab-count-badge">{activeQueueAlerts.length}</span>
          </button>
          <button
            type="button"
            aria-pressed={activeTab === TAB_HISTORY}
            className={`status-chip ${activeTab === TAB_HISTORY ? 'status-chip-active' : ''}`}
            onClick={() => setActiveTab(TAB_HISTORY)}
          >
            Closed/Dismissed history <span className="tab-count-badge">{historyAlerts.length}</span>
          </button>
        </div>

        <div className="list-toolbar">
          <p className="results-counter">
            {visibleAlerts.length.toLocaleString()} alerts in {activeTab === TAB_ACTIVE_QUEUE ? 'active queue' : 'history'}
          </p>
        </div>

        {loading ? <SkeletonLoader rows={6} rowHeight={18} /> : null}
        {!loading && visibleAlerts.length === 0 ? (
          <EmptyState
            icon={<span aria-hidden="true">[i]</span>}
            message={
              activeTab === TAB_ACTIVE_QUEUE
                ? 'No active alerts match current filters.'
                : 'No closed or dismissed alerts match current filters.'
            }
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        ) : null}

        {!loading && visibleAlerts.length > 0 ? (
          <div className="table-container table-container--responsive">
            <table className="data-table data-table--sticky-first-column">
              <caption className="sr-only">Alert queue table</caption>
              <thead>
                <tr>
                  <th scope="col">Alert ID</th>
                  <th scope="col">Rule</th>
                  <th scope="col">Severity</th>
                  <th scope="col">Status</th>
                  <th scope="col">Transaction</th>
                  <th scope="col">Created</th>
                  {activeTab === TAB_ACTIVE_QUEUE ? <th scope="col">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {visibleAlerts.map((alert) => {
                  const isExpanded = expandedAlertIds.has(alert.id);
                  const isUpdatingRow = Boolean(updatingAlertIds[alert.id]);
                  const timeline = getAlertTimeline(alert);

                  return (
                    <Fragment key={alert.id}>
                      <tr key={alert.id}>
                        <td data-label="Alert ID">
                          <button
                            type="button"
                            className="btn btn-ghost btn-small expand-row-btn"
                            onClick={() => toggleAlertExpansion(alert.id)}
                            aria-expanded={isExpanded}
                            aria-controls={`alert-details-${alert.id}`}
                            aria-label={`${isExpanded ? 'Hide' : 'Show'} details for alert ${alert.alertId}`}
                          >
                            {isExpanded ? 'Hide' : 'Show'} {alert.alertId}
                          </button>
                        </td>
                        <td data-label="Rule">{alert.ruleName}</td>
                        <td data-label="Severity">
                          <StatusBadge value={alert.severity} />
                        </td>
                        <td data-label="Status">
                          <StatusBadge value={alert.status} />
                        </td>
                        <td data-label="Transaction">{alert.transactionReference}</td>
                        <td data-label="Created">{formatDateTime(alert.createdAt)}</td>
                        {activeTab === TAB_ACTIVE_QUEUE ? (
                          <td data-label="Actions">
                            <div className="table-actions">
                              <button
                                className="btn btn-small"
                                type="button"
                                disabled={
                                  isUpdatingRow ||
                                  !canTransitionAlert(alert.status, ALERT_STATUS.ACKNOWLEDGED)
                                }
                                onClick={() => requestTransition(alert, ALERT_STATUS.ACKNOWLEDGED)}
                                aria-busy={isUpdatingRow}
                              >
                                {isUpdatingRow ? 'Updating...' : 'Acknowledge'}
                              </button>
                              <button
                                className="btn btn-small"
                                type="button"
                                disabled={
                                  isUpdatingRow ||
                                  !canTransitionAlert(alert.status, ALERT_STATUS.INVESTIGATING)
                                }
                                onClick={() => requestTransition(alert, ALERT_STATUS.INVESTIGATING)}
                                aria-busy={isUpdatingRow}
                              >
                                {isUpdatingRow ? 'Updating...' : 'Investigate'}
                              </button>
                              <button
                                className="btn btn-small"
                                type="button"
                                disabled={
                                  isUpdatingRow ||
                                  !canTransitionAlert(alert.status, ALERT_STATUS.CLOSED)
                                }
                                onClick={() => requestTransition(alert, ALERT_STATUS.CLOSED)}
                                aria-busy={isUpdatingRow}
                              >
                                {isUpdatingRow ? <span className="inline-spinner" aria-hidden="true" /> : null}
                                Close
                              </button>
                              <button
                                className="btn btn-small btn-danger"
                                type="button"
                                disabled={
                                  isUpdatingRow ||
                                  !canTransitionAlert(alert.status, ALERT_STATUS.DISMISSED)
                                }
                                onClick={() => requestTransition(alert, ALERT_STATUS.DISMISSED)}
                                aria-busy={isUpdatingRow}
                              >
                                {isUpdatingRow ? <span className="inline-spinner" aria-hidden="true" /> : null}
                                Dismiss
                              </button>
                            </div>
                          </td>
                        ) : null}
                      </tr>

                      {isExpanded ? (
                        <tr key={`${alert.id}-details`} className="alert-details-row">
                          <td
                            id={`alert-details-${alert.id}`}
                            data-label="Details"
                            colSpan={activeTab === TAB_ACTIVE_QUEUE ? 7 : 6}
                          >
                            <div className="alert-details-content">
                              <p className="alert-details-reason">
                                <strong>Reason:</strong> {alert.reason || 'No reason provided.'}
                              </p>
                              <div>
                                <strong>Timeline:</strong>
                                <ul className="alert-timeline">
                                  {timeline.map((event, index) => (
                                    <li key={`${alert.id}-timeline-${index}`}>
                                      <StatusBadge value={event.status || alert.status} />
                                      <span>{formatDateTime(event.changedAt || event.updatedAt)}</span>
                                      <span>{event.note || event.reason || 'Status updated.'}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>

      <ConfirmDialog
        isOpen={Boolean(pendingTransition)}
        title={pendingTransition?.targetStatus === ALERT_STATUS.DISMISSED ? 'Dismiss alert' : 'Close alert'}
        message={
          pendingTransition
            ? `Move alert ${pendingTransition.alert.alertId} to ${pendingTransition.targetStatus}?`
            : ''
        }
        confirmLabel={pendingTransition?.targetStatus === ALERT_STATUS.DISMISSED ? 'Dismiss' : 'Close'}
        cancelLabel="Cancel"
        onConfirm={confirmPendingTransition}
        onCancel={() => setPendingTransition(null)}
        tone={pendingTransition?.targetStatus === ALERT_STATUS.DISMISSED ? 'danger' : 'default'}
      />
    </section>
  );
}
