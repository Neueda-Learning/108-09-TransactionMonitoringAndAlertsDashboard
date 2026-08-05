import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ConfirmDialog from '../components/ConfirmDialog';
import { RULE_TYPES, SEVERITIES } from '../constants';
import SeverityDonutChart from '../components/charts/SeverityDonutChart';
import RuleTriggerFrequencyChart from '../components/charts/RuleTriggerFrequencyChart';

const defaultForm = {
  ruleName: '',
  ruleType: RULE_TYPES[0],
  threshold: '',
  timeWindowMinutes: '',
  severity: 'MEDIUM',
  active: true
};

const RULE_TYPE_CONFIG = {
  AMOUNT_THRESHOLD: {
    showThreshold: true,
    showTimeWindow: false,
    thresholdLabel: 'Threshold Amount',
    thresholdHelper: 'Triggers when a single transaction amount exceeds this value.',
    helperText:
      'Threshold is the max allowed amount for one transaction. Time window is not used for this type.'
  },
  VELOCITY: {
    showThreshold: true,
    showTimeWindow: true,
    thresholdLabel: 'Max Transactions (Threshold)',
    thresholdHelper: 'Maximum allowed number of transactions in the selected time window.',
    helperText:
      'Threshold is the transaction count limit. Time window defines how many minutes are evaluated together.'
  },
  NEW_PAYEE: {
    showThreshold: true,
    showTimeWindow: false,
    thresholdLabel: 'Minimum Alert Amount',
    thresholdHelper: 'Only new-payee transactions at or above this amount are evaluated.',
    helperText:
      'Threshold is the minimum amount that can trigger an alert for a first-time payee. Time window is not used.'
  },
  DAILY_LIMIT: {
    showThreshold: true,
    showTimeWindow: false,
    thresholdLabel: 'Daily Limit Amount',
    thresholdHelper: 'Triggers when projected daily total exceeds this value.',
    helperText:
      'Threshold is the daily limit cap for an account. Time window is not used because checks are calendar-day based.'
  }
};

const SEVERITY_SORT_RANK = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3
};

function normalizeSeverity(value) {
  return String(value || '').toUpperCase();
}

function toPayload(formState) {
  return {
    ...formState,
    threshold: formState.threshold === '' ? null : Number(formState.threshold),
    timeWindowMinutes:
      formState.timeWindowMinutes === '' ? null : Number(formState.timeWindowMinutes)
  };
}

export default function RulesPage({
  rules,
  alerts,
  loading,
  error,
  onRetry,
  onCreate,
  onUpdate,
  onDelete
}) {
  const [formState, setFormState] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('severity');
  const [sortDirection, setSortDirection] = useState('desc');
  const [pendingDeleteRule, setPendingDeleteRule] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const normalizedRuleName = formState.ruleName.trim().toLowerCase();
  const ruleTypeConfig = RULE_TYPE_CONFIG[formState.ruleType] || RULE_TYPE_CONFIG.AMOUNT_THRESHOLD;

  const isDuplicateName = useMemo(() => {
    if (!normalizedRuleName) {
      return false;
    }

    return rules.some((rule) => {
      const sameName = (rule.ruleName || '').trim().toLowerCase() === normalizedRuleName;
      const sameRecord = editingId != null && String(rule.id) === String(editingId);
      return sameName && !sameRecord;
    });
  }, [rules, normalizedRuleName, editingId]);

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

  function handleSeveritySegmentClick(severity) {
    setSeverityFilter((prev) => (prev === severity ? '' : severity));
  }

  // eslint-disable-next-line no-unused-vars
  function handleRuleBarClick(ruleName) {
    setSearchQuery((prev) => (prev === ruleName ? '' : ruleName));
  }

  const filteredSortedRules = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filtered = rules.filter((rule) => {
      const matchesSeverity = !severityFilter || normalizeSeverity(rule.severity) === severityFilter;
      const matchesSearch =
        !normalizedSearch || (rule.ruleName || '').toLowerCase().includes(normalizedSearch);
      return matchesSeverity && matchesSearch;
    });

    const directionMultiplier = sortDirection === 'asc' ? 1 : -1;

    return [...filtered].sort((left, right) => {
      let comparison = 0;

      if (sortBy === 'severity') {
        comparison =
          (SEVERITY_SORT_RANK[normalizeSeverity(left.severity)] || 0) -
          (SEVERITY_SORT_RANK[normalizeSeverity(right.severity)] || 0);
      } else if (sortBy === 'active') {
        comparison = Number(Boolean(left.active)) - Number(Boolean(right.active));
      } else if (sortBy === 'type') {
        comparison = (left.ruleType || '').localeCompare(right.ruleType || '');
      }

      if (comparison === 0) {
        comparison = (left.ruleName || '').localeCompare(right.ruleName || '');
      }

      return comparison * directionMultiplier;
    });
  }, [rules, severityFilter, searchQuery, sortBy, sortDirection]);

  function handleDeleteClick(rule) {
    setPendingDeleteRule(rule);
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteRule || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(pendingDeleteRule.id);
      setPendingDeleteRule(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const deletingCriticalRule =
    Boolean(pendingDeleteRule?.active) && normalizeSeverity(pendingDeleteRule?.severity) === 'HIGH';
  const deleteMessage = pendingDeleteRule
    ? `Delete rule "${pendingDeleteRule.ruleName || pendingDeleteRule.id}"? This cannot be undone.${
        deletingCriticalRule
          ? '\nWarning: This rule is currently Active and HIGH severity, so deleting it can weaken production monitoring coverage immediately.'
          : ''
      }`
    : '';

  return (
    <section>
      <PageHeader
        title="Rules"
        subtitle="Manage monitoring rules used by the backend engine"
      />

      {error ? <ErrorState message="Unable to load rules." error={error} onRetry={onRetry} /> : null}

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
            {isDuplicateName ? (
              <small className="field-warning">
                A rule with this name already exists. You can still save if this is intentional.
              </small>
            ) : null}
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
            <small className="field-helper">{ruleTypeConfig.helperText}</small>
          </label>

          {ruleTypeConfig.showThreshold ? (
            <label>
              {ruleTypeConfig.thresholdLabel}
              <input
                type="number"
                step={formState.ruleType === 'VELOCITY' ? '1' : '0.01'}
                min={formState.ruleType === 'VELOCITY' ? '1' : '0'}
                value={formState.threshold}
                onChange={(event) => setFormState((prev) => ({ ...prev, threshold: event.target.value }))}
              />
              <small className="field-helper">{ruleTypeConfig.thresholdHelper}</small>
            </label>
          ) : null}

          {ruleTypeConfig.showTimeWindow ? (
            <label>
              Time Window (Minutes)
              <input
                type="number"
                min="1"
                value={formState.timeWindowMinutes}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, timeWindowMinutes: event.target.value }))
                }
              />
              <small className="field-helper">
                Number of minutes used to calculate transaction velocity for each account.
              </small>
            </label>
          ) : null}

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
            Active / Inactive
            <button
              className={`toggle-switch ${formState.active ? 'is-active' : ''}`}
              type="button"
              role="switch"
              aria-checked={formState.active}
              onClick={() => setFormState((prev) => ({ ...prev, active: !prev.active }))}
            >
              <span className="toggle-switch-track" aria-hidden="true">
                <span className="toggle-switch-thumb" />
              </span>
              <span className="toggle-switch-label">{formState.active ? 'Active' : 'Inactive'}</span>
            </button>
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

      <div className="card-grid">
        <article className="card">
          <h3>Rules by Severity</h3>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--muted)', margin: '0 0 8px' }}>
            Click a segment to filter the rule list below
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
          <SeverityDonutChart items={rules} onSegmentClick={handleSeveritySegmentClick} />
          <div className="severity-legend" aria-label="Severity legend">
            <span className="severity-legend-item">
              <StatusBadge value="HIGH" />
              High risk, immediate attention recommended
            </span>
            <span className="severity-legend-item">
              <StatusBadge value="MEDIUM" />
              Moderate risk, monitor and investigate
            </span>
            <span className="severity-legend-item">
              <StatusBadge value="LOW" />
              Lower risk, monitor trend impact
            </span>
          </div>
        </article>
        <article className="card">
          <h3>Rule Trigger Frequency</h3>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--muted)', margin: '0 0 8px' }}>
            Click a bar to filter by rule name
            {searchQuery && (
              <button
                className="btn btn-small"
                style={{ marginLeft: 8 }}
                onClick={() => setSearchQuery('')}
              >
                Clear ("{searchQuery}")
              </button>
            )}
          </p>
          <RuleTriggerFrequencyChart alerts={alerts || []} rules={rules} onBarClick={handleRuleBarClick} />
        </article>
      </div>

      <article className="panel">
        <h2>Rule List</h2>

        <div className="filter-row rules-list-controls">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search rule name"
            aria-label="Search rule name"
          />
          <label>
            Sort by
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="severity">Severity</option>
              <option value="active">Active status</option>
              <option value="type">Rule type</option>
            </select>
          </label>
          <label>
            Direction
            <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value)}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
        </div>

        {(severityFilter || searchQuery) && (
          <div className="filter-row" style={{ marginBottom: 12 }}>
            {severityFilter && (
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--muted)' }}>
                Severity: <strong>{severityFilter}</strong>
              </span>
            )}
            {searchQuery && (
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--muted)' }}>
                Search: <strong>{searchQuery}</strong>
              </span>
            )}
            <button className="btn btn-small" onClick={() => { setSeverityFilter(''); setSearchQuery(''); }}>
              Clear filters
            </button>
          </div>
        )}

        {loading ? <SkeletonLoader rows={6} rowHeight={18} /> : null}
        {!loading && filteredSortedRules.length === 0 ? (
          <EmptyState
            icon={<span aria-hidden="true">[!]</span>}
            message={rules.length === 0 ? 'No rules found.' : 'No rules match the current filters.'}
            actionLabel={rules.length === 0 && onRetry ? 'Refresh Rules' : ''}
            onAction={rules.length === 0 ? onRetry : undefined}
          />
        ) : null}

        {!loading && filteredSortedRules.length > 0 ? (
          <div className="table-container">
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
                {filteredSortedRules.map((rule) => (
                  <tr key={rule.id}>
                    <td data-label="ID">{rule.id}</td>
                    <td data-label="Name">{rule.ruleName}</td>
                    <td data-label="Type">{rule.ruleType}</td>
                    <td data-label="Threshold">{rule.threshold ?? '-'}</td>
                    <td data-label="Window (m)">{rule.timeWindowMinutes ?? '-'}</td>
                    <td data-label="Severity">
                      <StatusBadge value={rule.severity} />
                    </td>
                    <td data-label="Active">
                      <StatusBadge value={rule.active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td data-label="Actions">
                      <div className="table-actions">
                        <button className="btn btn-small" onClick={() => startEdit(rule)}>
                          Edit
                        </button>
                        <button className="btn btn-small btn-danger" onClick={() => handleDeleteClick(rule)}>
                          Delete
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

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteRule)}
        title="Delete Rule"
        message={deleteMessage}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Rule'}
        cancelLabel="Keep Rule"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) {
            setPendingDeleteRule(null);
          }
        }}
        tone="danger"
      />
    </section>
  );
}

