export default function EmptyState({
  icon,
  message,
  actionLabel,
  onAction,
  actionDisabled = false
}) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      {icon ? <div className="empty-state-icon">{icon}</div> : null}
      <p className="empty-state-message">{message}</p>
      {actionLabel && onAction ? (
        <button className="btn" type="button" disabled={actionDisabled} onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

