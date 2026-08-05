import { useMemo, useState } from 'react';
import EmptyState from '../EmptyState';

// Ordered lifecycle stages
const STAGES = [
  { key: 'OPEN',          label: 'Open',          color: '#c22f2f', light: '#ffe7e7' },
  { key: 'ACKNOWLEDGED',  label: 'Acknowledged',  color: '#b07400', light: '#fff2d6' },
  { key: 'INVESTIGATING', label: 'Investigating', color: '#1f5fa8', light: '#dff0ff' },
  { key: 'CLOSED',        label: 'Closed',        color: '#2d7a2d', light: '#dff7df' },
  { key: 'DISMISSED',     label: 'Dismissed',     color: '#65708a', light: '#f1f5f9' },
];

export default function AlertLifecycleFunnel({ alerts = [] }) {
  const [hovered, setHovered] = useState(null);

  const stageCounts = useMemo(() => {
    const counts = {};
    for (const stage of STAGES) counts[stage.key] = 0;
    for (const alert of alerts) {
      const s = (alert.status || '').toUpperCase();
      if (s in counts) counts[s] += 1;
    }
    return counts;
  }, [alerts]);

  const total = useMemo(
    () => Object.values(stageCounts).reduce((s, v) => s + v, 0),
    [stageCounts]
  );

  if (total === 0) {
    return (
      <EmptyState
        icon={<span aria-hidden="true">🔻</span>}
        message="No alert data available for lifecycle funnel."
      />
    );
  }

  return (
    <div style={{ padding: '4px 0' }}>
      {STAGES.map((stage, i) => {
        const count = stageCounts[stage.key];
        const pct   = total > 0 ? (count / total) * 100 : 0;
        const isHov = hovered === stage.key;

        // Drop-off from the immediately prior stage (only when that stage had items)
        let dropLabel = null;
        if (i > 0) {
          const prev = stageCounts[STAGES[i - 1].key];
          if (prev > 0 && count < prev) {
            const drop = (((prev - count) / prev) * 100).toFixed(0);
            dropLabel = `↓ ${drop}% from ${STAGES[i - 1].label}`;
          }
        }

        return (
          <div
            key={stage.key}
            style={{
              marginBottom: 10,
              padding: '8px 10px',
              borderRadius: 8,
              background: isHov ? stage.light : 'transparent',
              border: `1px solid ${isHov ? stage.color : 'transparent'}`,
              transition: 'background 0.15s, border-color 0.15s',
              cursor: 'default',
            }}
            onMouseEnter={() => setHovered(stage.key)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: stage.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontWeight: 600, fontSize: 13, color: '#20263a' }}>{stage.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {dropLabel && (
                  <span style={{ fontSize: 10, color: '#c22f2f', fontWeight: 600 }}>{dropLabel}</span>
                )}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isHov ? stage.color : '#20263a',
                    minWidth: 32,
                    textAlign: 'right',
                  }}
                >
                  {count.toLocaleString()}
                </span>
                <span style={{ fontSize: 11, color: '#65708a', minWidth: 42, textAlign: 'right' }}>
                  {pct.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Bar track */}
            <div
              style={{
                position: 'relative',
                height: 22,
                background: '#e2e8f0',
                borderRadius: 999,
                overflow: 'hidden',
              }}
              role="progressbar"
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${stage.label}: ${count} of ${total} alerts`}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${pct.toFixed(2)}%`,
                  minWidth: count > 0 ? 6 : 0,
                  background: stage.color,
                  borderRadius: 999,
                  transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: pct > 12 ? 8 : 0,
                  overflow: 'hidden',
                }}
              >
                {pct > 12 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                    {count.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 6, paddingTop: 6, borderTop: '1px solid #d8deea' }}>
        <span style={{ fontSize: 11, color: '#65708a' }}>Total alerts</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#20263a' }}>{total.toLocaleString()}</span>
      </div>
    </div>
  );
}
