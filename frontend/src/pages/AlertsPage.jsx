import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { ALERT_STATUS } from '../constants';
import { alertsApi } from '../api/alertsApi';
import { canTransitionAlert } from '../utils/alerts';
import { formatDateTime } from '../utils/formatters';

const REFRESH_INTERVAL_MS = Number(process.env.REACT_APP_ALERTS_POLL_MS || 3000);

const SEVERITY_COLORS = { HIGH: '#f43f5e', MEDIUM: '#f59e0b', LOW: '#00d4ff' };
const STATUS_COLORS = {
  OPEN: '#f59e0b',
  ACKNOWLEDGED: '#4f7eff',
  INVESTIGATING: '#7c3aed',
  CLOSED: '#00c48c',
  DISMISSED: '#6b7da8'
};

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#162040', border: '1px solid #263660',
        borderRadius: 10, padding: '10px 14px', color: '#e8edf8', fontSize: 13
      }}>
        {label && <div style={{ color: '#6b7da8', marginBottom: 4, fontSize: 11, textTransform: 'uppercase' }}>{label}</div>}
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color || p.fill, fontWeight: 700 }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
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

export default function AlertsPage({ transactions, rules, onNotify }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchAlerts = useCallback(async ({ notify = false } = {}) => {
    try {
      setError('');
      const backendAlerts = await alertsApi.getAll();
      setAlerts(normalizeAlerts(backendAlerts, transactions, rules));

      if (notify) {
        onNotify?.('Alerts refreshed.', 'success');
      }
    } catch (err) {
      setError(err.message || 'Failed to load alerts from backend API.');
    }
  }, [transactions, rules, onNotify]);

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

  const severityData = useMemo(() => {
    const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    alerts.forEach((a) => { if (counts[a.severity] !== undefined) counts[a.severity]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [alerts]);

  const statusData = useMemo(() => {
    const counts = { OPEN: 0, ACKNOWLEDGED: 0, INVESTIGATING: 0, CLOSED: 0, DISMISSED: 0 };
    alerts.forEach((a) => { if (counts[a.status] !== undefined) counts[a.status]++; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [alerts]);

  const ruleAlertData = useMemo(() => {
    const map = {};
    alerts.forEach((a) => {
      const key = a.ruleName.length > 18 ? a.ruleName.slice(0, 18) + '\u2026' : a.ruleName;
      if (!map[key]) map[key] = { rule: key, count: 0 };
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [alerts]);

  async function transitionAlert(alert, targetStatus) {
    if (!canTransitionAlert(alert.status, targetStatus)) return;
    setIsUpdatingStatus(true);
    try {
      await alertsApi.updateStatus(alert.id, targetStatus);
      await fetchAlerts();

      const actionLabel = {
        [ALERT_STATUS.ACKNOWLEDGED]: 'acknowledged',
        [ALERT_STATUS.INVESTIGATING]: 'marked investigating',
        [ALERT_STATUS.CLOSED]: 'closed',
        [ALERT_STATUS.DISMISSED]: 'dismissed'
      }[targetStatus];

      onNotify?.(`Alert ${alert.alertId} ${actionLabel || 'updated'}.`, 'success');
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
        subtitle={
          <span>
            <span className="pulse-dot"></span>
            Auto-refresh every {REFRESH_INTERVAL_MS / 1000}s via /api/alerts
          </span>
        }
        action={
          <button
            className="btn btn-primary"
            onClick={() => fetchAlerts({ notify: true })}
            disabled={loading || isUpdatingStatus}
          >
            &#8635; Refresh Now
          </button>
        }
      />

      {error ? <div className="error-box">&#9888; {error}</div> : null}

      <div className="card-grid">
        <article className="card stat-card-danger">
          <div className="card-icon" style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}>&#9673;</div>
          <h3>Total Alerts</h3>
          <strong>{alerts.length}</strong>
          <div className="card-trend" style={{ color: '#f43f5e' }}>All time</div>
        </article>
        <article className="card stat-card-warning">
          <div className="card-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>&#9889;</div>
          <h3>Active Alerts</h3>
          <strong>{activeAlerts.length}</strong>
          <div className="card-trend" style={{ color: '#f59e0b' }}>Needs action</div>
        </article>
        <article className="card stat-card-danger">
          <div className="card-icon" style={{ background: 'rgba(244,63,94,0.15)', color: '#ff7089' }}>&#9650;</div>
          <h3>High Severity</h3>
          <strong>{alerts.filter(a => a.severity === 'HIGH').length}</strong>
          <div className="card-trend" style={{ color: '#ff7089' }}>Critical priority</div>
        </article>
        <article className="card stat-card-success">
          <div className="card-icon" style={{ background: 'rgba(0,196,140,0.15)', color: '#00c48c' }}>&#10003;</div>
          <h3>Resolved</h3>
          <strong>{alerts.filter(a => [ALERT_STATUS.CLOSED, ALERT_STATUS.DISMISSED].includes(a.status)).length}</strong>
          <div className="card-trend" style={{ color: '#00c48c' }}>Closed + dismissed</div>
        </article>
      </div>

      {alerts.length > 0 && (
        <div className="chart-grid">
          <div className="chart-panel">
            <h3><span className="dot" style={{ background: '#f43f5e' }}></span>Severity Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={5} dataKey="value" nameKey="name">
                  {severityData.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#6b7da8'} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#b0bcd8', fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-panel">
            <h3><span className="dot" style={{ background: '#4f7eff' }}></span>Alert Status Overview</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,126,255,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7da8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7da8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Alerts" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6b7da8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {ruleAlertData.length > 0 && (
            <div className="chart-panel">
              <h3><span className="dot" style={{ background: '#f59e0b' }}></span>Alerts by Rule</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ruleAlertData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ruleGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,126,255,0.08)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6b7da8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="rule" tick={{ fill: '#b0bcd8', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Alerts" fill="url(#ruleGrad)" radius={[0, 6, 6, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <article className="panel">
        <h2>Active Alerts</h2>
        {loading ? (
          <div className="loading-state"><div className="spinner"></div><span>Loading alerts&#8230;</span></div>
        ) : null}
        {!loading && activeAlerts.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">&#128737;</div><p>No active alerts - all clear!</p></div>
        ) : null}
        {!loading && activeAlerts.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Alert ID</th><th>Rule</th><th>Severity</th><th>Status</th>
                <th>Transaction</th><th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13, color: '#7ab2ff' }}>{alert.alertId}</td>
                  <td style={{ fontWeight: 600, color: '#e8edf8' }}>{alert.ruleName}</td>
                  <td><StatusBadge value={alert.severity} /></td>
                  <td><StatusBadge value={alert.status} /></td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7da8' }}>{alert.transactionRef}</td>
                  <td style={{ color: '#6b7da8', fontSize: 13 }}>{formatDateTime(alert.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-small" disabled={isUpdatingStatus || !canTransitionAlert(alert.status, ALERT_STATUS.ACKNOWLEDGED)} onClick={() => transitionAlert(alert, ALERT_STATUS.ACKNOWLEDGED)}>Acknowledge</button>
                      <button className="btn btn-small" disabled={isUpdatingStatus || !canTransitionAlert(alert.status, ALERT_STATUS.INVESTIGATING)} onClick={() => transitionAlert(alert, ALERT_STATUS.INVESTIGATING)}>Investigate</button>
                      <button className="btn btn-small" disabled={isUpdatingStatus || !canTransitionAlert(alert.status, ALERT_STATUS.CLOSED)} onClick={() => transitionAlert(alert, ALERT_STATUS.CLOSED)}>Close</button>
                      <button className="btn btn-small btn-danger" disabled={isUpdatingStatus || !canTransitionAlert(alert.status, ALERT_STATUS.DISMISSED)} onClick={() => transitionAlert(alert, ALERT_STATUS.DISMISSED)}>Dismiss</button>
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
        {loading ? <div className="loading-state"><div className="spinner"></div></div> : null}
        {!loading && alerts.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">&#128203;</div><p>No history yet.</p></div>
        ) : null}
        {!loading && alerts.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr><th>Alert ID</th><th>Status</th><th>Updated At</th><th>Reason</th></tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={`history-${alert.id}`}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13, color: '#7ab2ff' }}>{alert.alertId}</td>
                  <td><StatusBadge value={alert.status} /></td>
                  <td style={{ color: '#6b7da8', fontSize: 13 }}>{formatDateTime(alert.updatedAt)}</td>
                  <td style={{ color: '#b0bcd8', fontSize: 13 }}>{alert.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </article>
    </section>
  );
}
