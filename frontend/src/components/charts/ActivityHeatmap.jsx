import { useMemo, useState } from 'react';
import EmptyState from '../EmptyState';

const CELL_SIZE = 14;
const CELL_GAP  = 3;
const WEEKS     = 12;
const DAYS      = 7;

// Color stops for the heatmap intensity scale (0 → max)
const HEAT_STOPS = [
  { threshold: 0,    color: '#e2e8f0' }, // empty
  { threshold: 0.01, color: '#c7d5f9' }, // 1% of max → light blue
  { threshold: 0.25, color: '#7e9ef0' },
  { threshold: 0.50, color: '#2251d1' },
  { threshold: 0.75, color: '#1a3fa8' },
  { threshold: 1.00, color: '#0d2270' }, // max
];

function heatColor(count, maxCount) {
  if (count === 0 || maxCount === 0) return HEAT_STOPS[0].color;
  const ratio = count / maxCount;
  for (let i = HEAT_STOPS.length - 1; i >= 0; i--) {
    if (ratio >= HEAT_STOPS[i].threshold) return HEAT_STOPS[i].color;
  }
  return HEAT_STOPS[0].color;
}

function buildHeatmapData(transactions) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - WEEKS * DAYS + 1);

  const buckets = new Map();
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const tx of transactions) {
    const raw = tx.transactionTime || tx.createdAt || tx.date;
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + 1);
  }

  const maxCount = Math.max(0, ...buckets.values());
  return { buckets, startDate, maxCount };
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ActivityHeatmap({ transactions = [] }) {
  const [tooltip, setTooltip] = useState(null);

  const { buckets, startDate, maxCount } = useMemo(
    () => buildHeatmapData(transactions),
    [transactions]
  );

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<span aria-hidden="true">🗓</span>}
        message="No transaction data available for the activity heatmap."
      />
    );
  }

  // Build cell grid
  const cells = [];
  for (let i = 0; i < WEEKS * DAYS; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key   = d.toISOString().slice(0, 10);
    const count = buckets.get(key) ?? 0;
    cells.push({ key, date: d, count, col: Math.floor(i / DAYS), row: i % DAYS });
  }

  // Month labels
  const monthLabels = [];
  let lastMonth = -1;
  for (const cell of cells) {
    if (cell.date.getDate() === 1 && cell.date.getMonth() !== lastMonth) {
      monthLabels.push({
        col:   cell.col,
        label: cell.date.toLocaleString('en-US', { month: 'short' }),
      });
      lastMonth = cell.date.getMonth();
    }
  }

  const LABEL_W  = 28;
  const MONTH_H  = 18;
  const svgW     = LABEL_W + WEEKS * (CELL_SIZE + CELL_GAP);
  const svgH     = MONTH_H + DAYS * (CELL_SIZE + CELL_GAP);
  const totalTx  = Array.from(buckets.values()).reduce((s, v) => s + v, 0);
  const activeDays = Array.from(buckets.values()).filter((v) => v > 0).length;

  function handleCellEnter(cell, evt) {
    setTooltip({
      dateStr: cell.date.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      }),
      count: cell.count,
      x: evt.clientX,
      y: evt.clientY,
    });
  }

  function handleMouseMove(evt) {
    if (tooltip) setTooltip((p) => ({ ...p, x: evt.clientX, y: evt.clientY }));
  }

  return (
    <div>
      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Transactions (12 wk window)', value: totalTx.toLocaleString() },
          { label: 'Active days',  value: activeDays },
          { label: 'Peak day',     value: maxCount > 0 ? maxCount : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 11, color: '#65708a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#20263a' }}>{value}</div>
          </div>
        ))}
      </div>

      <div
        style={{ position: 'relative', overflowX: 'auto' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <svg
          width={svgW}
          height={svgH}
          aria-label="Activity heatmap — transaction density by day"
          role="img"
          style={{ display: 'block', userSelect: 'none' }}
        >
          {/* Day-of-week labels (odd rows only to avoid crowding) */}
          {DAY_LABELS.map((lbl, i) =>
            i % 2 === 1 ? (
              <text
                key={lbl}
                x={LABEL_W - 4}
                y={MONTH_H + i * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 2}
                textAnchor="end"
                fontSize={9}
                fill="#65708a"
              >
                {lbl}
              </text>
            ) : null
          )}

          {/* Month labels */}
          {monthLabels.map(({ col, label }) => (
            <text
              key={`${col}-${label}`}
              x={LABEL_W + col * (CELL_SIZE + CELL_GAP)}
              y={MONTH_H - 4}
              fontSize={9}
              fill="#65708a"
            >
              {label}
            </text>
          ))}

          {/* Cells */}
          {cells.map((cell) => (
            <rect
              key={cell.key}
              x={LABEL_W + cell.col * (CELL_SIZE + CELL_GAP)}
              y={MONTH_H + cell.row * (CELL_SIZE + CELL_GAP)}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={3}
              ry={3}
              fill={heatColor(cell.count, maxCount)}
              stroke={cell.count > 0 ? 'rgba(0,0,0,0.06)' : '#d8deea'}
              strokeWidth={0.5}
              onMouseEnter={(evt) => handleCellEnter(cell, evt)}
              style={{ transition: 'fill 0.1s', cursor: 'default' }}
            />
          ))}
        </svg>

        {/* Hover tooltip */}
        {tooltip && (
          <div
            style={{
              position: 'fixed',
              left: tooltip.x + 14,
              top:  tooltip.y - 52,
              background: '#fff',
              border: '1.5px solid #2251d1',
              borderRadius: 8,
              padding: '7px 12px',
              fontSize: 12,
              color: '#20263a',
              pointerEvents: 'none',
              zIndex: 9999,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(34,81,209,0.14)',
            }}
            role="tooltip"
          >
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip.dateStr}</div>
            <div style={{ color: tooltip.count > 0 ? '#2251d1' : '#65708a', fontWeight: tooltip.count > 0 ? 700 : 400 }}>
              {tooltip.count === 0
                ? 'No transactions'
                : `${tooltip.count.toLocaleString()} transaction${tooltip.count !== 1 ? 's' : ''}`}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, color: '#65708a', paddingLeft: LABEL_W }}>
        <span>Less</span>
        {HEAT_STOPS.map((s) => (
          <svg key={s.threshold} width={CELL_SIZE} height={CELL_SIZE} style={{ flexShrink: 0 }}>
            <rect width={CELL_SIZE} height={CELL_SIZE} rx={3} fill={s.color} />
          </svg>
        ))}
        <span>More</span>
      </div>

      <p style={{ fontSize: 11, color: '#65708a', marginTop: 4, paddingLeft: LABEL_W }}>
        Showing last {WEEKS} weeks · transactions outside this window are not displayed
      </p>
    </div>
  );
}
