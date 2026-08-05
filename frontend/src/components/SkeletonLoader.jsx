function toSafeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default function SkeletonLoader({ rows = 3, rowHeight = 16, className = '' }) {
  const safeRows = Math.max(1, Math.floor(toSafeNumber(rows, 3)));
  const safeRowHeight = toSafeNumber(rowHeight, 16);

  return (
    <div className={`skeleton-loader ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: safeRows }).map((_, index) => (
        <span
          key={`skeleton-row-${index}`}
          className="skeleton-loader-row"
          style={{ height: `${safeRowHeight}px` }}
        />
      ))}
    </div>
  );
}

