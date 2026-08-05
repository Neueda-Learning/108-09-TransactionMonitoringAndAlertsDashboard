import { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { RULE_TYPES, SEVERITIES } from '../constants';

const RULE_COLORS = ['#4f7eff', '#00d4ff', '#00c48c', '#f59e0b', '#f43f5e'];
const SEV_COLORS = { HIGH: '#f43f5e', MEDIUM: '#f59e0b', LOW: '#00d4ff' };

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

const defaultForm = {
  ruleName: '',
  ruleType: RULE_TYPES[0],
  threshold: '',
  timeWindowMinutes: '',
  severity: 'MEDIUM',
  active: true
};

function toPayload(formState) {
  return {
    ...formState,
    threshold: formState.threshold === '' ? null : Number(formState.threshold),
    timeWindowMinutes:
      formState.timeWindowMinutes === '' ? null : Number(formState.timeWindowMinutes)
  };
}

export default function RulesPage({ rules, loading, error, onCreate, onUpdate, onDelete, onNotify }) {
  const [formState, setFormState] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setFormState(defaultForm);
    setEditingId(null);
  }

  function startEdit(rule) {
    setEditingId(rule.id);
    onNotify?.(`Editing rule ${rule.ruleName}.`, 'info');
    setFormState({
      ruleName: rule.ruleName || '',
      ruleType: rule.ruleType || RULE_TYPES[0],
      threshold: rule.threshold ?? '',
      timeWindowMinutes: rule.timeWindowMinutes ?? '',
      severity: rule.severity || 'MEDIUM',
      active: Boolean(rule.active)
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdate(editingId, toPayload(formState));
      } else {
        await onCreate(toPayload(formState));
      }
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  }

  const ruleTypeData = useMemo(() => {
    const counts = {};
    rules.forEach((r) => { counts[r.ruleType] = (counts[r.ruleType] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rules]);

  const severityData = useMemo(() => {
    const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    rules.forEach((r) => { if (counts[r.severity] !== undefined) counts[r.severity]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rules]);

  const activeCount = rules.filter((r) => r.active).length;
  const inactiveCount = rules.length - activeCount;

  return (
    <section>
      <PageHeader title="Rules" subtitle="Manage monitoring rules used by the backend engine" />

      {error ? <div className="error-box">&#9888; {error}</div> : null}

      <div className="card-grid">
        <article className="card stat-card-primary">
          <div className="card-icon" style={{ background: 'rgba(79,126,255,0.15)', color: '#4f7eff' }}>&#9881;</div>
          <h3>Total Rules</h3>
          <strong>{rules.length}</strong>
          <div className="card-trend">Configured</div>
        </article>
        <article className="card stat-card-success">
          <div className="card-icon" style={{ background: 'rgba(0,196,140,0.15)', color: '#00c48c' }}>&#9654;</div>
          <h3>Active Rules</h3>
          <strong>{activeCount}</strong>
          <div className="card-trend" style={{ color: '#00c48c' }}>Currently running</div>
        </article>
        <article className="card stat-card-warning">
          <div className="card-icon" style={{ background: 'rgba(107,125,168,0.15)', color: '#6b7da8' }}>&#9646;</div>
          <h3>Inactive Rules</h3>
          <strong>{inactiveCount}</strong>
          <div className="card-trend" style={{ color: '#6b7da8' }}>Paused</div>
        </article>
        <article className="card stat-card-danger">
          <div className="card-icon" style={{ background: 'rgba(244,63,94,0.15)', color: '#ff7089' }}>&#9650;</div>
          <h3>High Severity</h3>
          <strong>{rules.filter((r) => r.severity === 'HIGH').length}</strong>
          <div className="card-trend" style={{ color: '#ff7089' }}>Critical rules</div>
        </article>
      </div>

      {rules.length > 0 && (
        <div className="chart-grid">
          <div className="chart-panel">
            <h3><span className="dot"></span>Rule Type Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={ruleTypeData} cx="50%" cy="50%" outerRadius={75} paddingAngle={4} dataKey="value" nameKey="name" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {ruleTypeData.map((_, i) => (
                    <Cell key={i} fill={RULE_COLORS[i % RULE_COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-panel">
            <h3><span className="dot" style={{ background: '#f43f5e' }}></span>Rules by Severity</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={severityData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,126,255,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7da8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7da8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Rules" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {severityData.map((entry) => (
                    <Cell key={entry.name} fill={SEV_COLORS[entry.name] || '#6b7da8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-panel">
            <h3><span className="dot" style={{ background: '#00c48c' }}></span>Active vs Inactive</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[{ name: 'Active', value: activeCount }, { name: 'Inactive', value: inactiveCount }]}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value" nameKey="name"
                >
                  <Cell fill="#00c48c" stroke="transparent" />
                  <Cell fill="#6b7da8" stroke="transparent" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <article className="panel">
        <h2>{editingId ? 'Edit Rule' : 'Add Rule'}</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Rule Name
            <input required value={formState.ruleName} onChange={(e) => setFormState((p) => ({ ...p, ruleName: e.target.value }))} />
          </label>
          <label>
            Rule Type
            <select value={formState.ruleType} onChange={(e) => setFormState((p) => ({ ...p, ruleType: e.target.value }))}>
              {RULE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>
            Threshold
            <input type="number" step="0.01" min="0" value={formState.threshold} onChange={(e) => setFormState((p) => ({ ...p, threshold: e.target.value }))} />
          </label>
          <label>
            Time Window (Minutes)
            <input type="number" min="0" value={formState.timeWindowMinutes} onChange={(e) => setFormState((p) => ({ ...p, timeWindowMinutes: e.target.value }))} />
          </label>
          <label>
            Severity
            <select value={formState.severity} onChange={(e) => setFormState((p) => ({ ...p, severity: e.target.value }))}>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            Active
            <select value={String(formState.active)} onChange={(e) => setFormState((p) => ({ ...p, active: e.target.value === 'true' }))}>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>
          <div className="actions-row col-span-2">
            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingId ? 'Update Rule' : 'Add Rule'}
            </button>
            {editingId ? (
              <button
                className="btn"
                type="button"
                onClick={() => {
                  resetForm();
                  onNotify?.('Rule edit cancelled.', 'info');
                }}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </article>

      <article className="panel">
        <h2>Rule List</h2>
        {loading ? <div className="loading-state"><div className="spinner"></div><span>Loading rules&#8230;</span></div> : null}
        {!loading && rules.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">&#9881;</div><p>No rules found. Add your first rule above.</p></div>
        ) : null}
        {!loading && rules.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Type</th><th>Threshold</th>
                <th>Window (m)</th><th>Severity</th><th>Active</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td style={{ color: '#6b7da8', fontSize: 13 }}>{rule.id}</td>
                  <td style={{ fontWeight: 600, color: '#e8edf8' }}>{rule.ruleName}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#7ab2ff' }}>{rule.ruleType}</td>
                  <td>{rule.threshold ?? '-'}</td>
                  <td>{rule.timeWindowMinutes ?? '-'}</td>
                  <td><StatusBadge value={rule.severity} /></td>
                  <td><StatusBadge value={rule.active ? 'ACTIVE' : 'INACTIVE'} /></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-small" onClick={() => startEdit(rule)}>Edit</button>
                      <button className="btn btn-small btn-danger" onClick={() => onDelete(rule.id)}>Delete</button>
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
