import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { RULE_TYPES, SEVERITIES } from '../constants';

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

export default function RulesPage({ rules, loading, error, onCreate, onUpdate, onDelete }) {
  const [formState, setFormState] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setFormState(defaultForm);
    setEditingId(null);
  }

  function startEdit(rule) {
    setEditingId(rule.id);
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

  return (
    <section>
      <PageHeader
        title="Rules"
        subtitle="Manage monitoring rules used by the backend engine"
      />

      {error ? <div className="error-box">{error}</div> : null}

      <article className="panel">
        <h2>{editingId ? 'Edit Rule' : 'Add Rule'}</h2>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Rule Name
            <input
              required
              value={formState.ruleName}
              onChange={(event) => setFormState((prev) => ({ ...prev, ruleName: event.target.value }))}
            />
          </label>

          <label>
            Rule Type
            <select
              value={formState.ruleType}
              onChange={(event) => setFormState((prev) => ({ ...prev, ruleType: event.target.value }))}
            >
              {RULE_TYPES.map((ruleType) => (
                <option key={ruleType} value={ruleType}>
                  {ruleType}
                </option>
              ))}
            </select>
          </label>

          <label>
            Threshold
            <input
              type="number"
              step="0.01"
              min="0"
              value={formState.threshold}
              onChange={(event) => setFormState((prev) => ({ ...prev, threshold: event.target.value }))}
            />
          </label>

          <label>
            Time Window (Minutes)
            <input
              type="number"
              min="0"
              value={formState.timeWindowMinutes}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, timeWindowMinutes: event.target.value }))
              }
            />
          </label>

          <label>
            Severity
            <select
              value={formState.severity}
              onChange={(event) => setFormState((prev) => ({ ...prev, severity: event.target.value }))}
            >
              {SEVERITIES.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          </label>

          <label>
            Active
            <select
              value={String(formState.active)}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, active: event.target.value === 'true' }))
              }
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>

          <div className="actions-row col-span-2">
            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingId ? 'Update Rule' : 'Add Rule'}
            </button>
            {editingId ? (
              <button className="btn" type="button" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </article>

      <article className="panel">
        <h2>Rule List</h2>

        {loading ? <p>Loading...</p> : null}
        {!loading && rules.length === 0 ? <p>No rules found.</p> : null}

        {!loading && rules.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Threshold</th>
                <th>Window (m)</th>
                <th>Severity</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.id}</td>
                  <td>{rule.ruleName}</td>
                  <td>{rule.ruleType}</td>
                  <td>{rule.threshold ?? '-'}</td>
                  <td>{rule.timeWindowMinutes ?? '-'}</td>
                  <td>
                    <StatusBadge value={rule.severity} />
                  </td>
                  <td>
                    <StatusBadge value={rule.active ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-small" onClick={() => startEdit(rule)}>
                        Edit
                      </button>
                      <button className="btn btn-small btn-danger" onClick={() => onDelete(rule.id)}>
                        Delete
                      </button>
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

