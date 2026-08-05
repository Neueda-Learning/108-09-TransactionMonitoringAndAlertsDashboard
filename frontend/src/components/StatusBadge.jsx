export default function StatusBadge({ value }) {
  const normalized = String(value || '').toUpperCase();
  const map = {
    OPEN: 'badge badge-open',
    ACKNOWLEDGED: 'badge badge-ack',
    INVESTIGATING: 'badge badge-investigating',
    CLOSED: 'badge badge-closed',
    DISMISSED: 'badge badge-dismissed',
    HIGH: 'badge badge-high',
    MEDIUM: 'badge badge-medium',
    LOW: 'badge badge-low',
    ACTIVE: 'badge badge-active',
    INACTIVE: 'badge badge-inactive',
    COMPLETED: 'badge badge-completed',
    PENDING: 'badge badge-pending',
    FAILED: 'badge badge-failed'
  };

  const className = map[normalized] || 'badge';

  return <span className={className}>{value || '-'}</span>;
}

