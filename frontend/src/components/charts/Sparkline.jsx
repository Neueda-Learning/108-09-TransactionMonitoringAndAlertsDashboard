import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

// Resolved hex values so SVG gradients render correctly
const DEFAULTS = {
  primary: '#2251d1',
  success: '#2d7a2d',
  warn:    '#8a5a00',
  error:   '#c22f2f',
  info:    '#1f5fa8',
};

function resolveCssColor(value) {
  if (!value) return DEFAULTS.primary;
  if (value.startsWith('var(')) {
    const prop = value.match(/var\((--[\w-]+)\)/)?.[1];
    if (prop) {
      const resolved = getComputedStyle(document.documentElement)
        .getPropertyValue(prop)
        .trim();
      return resolved || DEFAULTS.primary;
    }
    return DEFAULTS.primary;
  }
  return value;
}

export default function Sparkline({ data = [], color, height = 60, label = '' }) {
  const chartData = useMemo(
    () => (Array.isArray(data) ? data.map((v, i) => ({ i, v: Number(v) || 0 })) : []),
    [data]
  );

  if (chartData.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--muted)' }}>No trend data</span>
      </div>
    );
  }

  const hex = resolveCssColor(
    color ||
    getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() ||
    DEFAULTS.primary
  );

  // Make gradient id unique per color so multiple sparklines don't clash
  const gradId = `spark-${hex.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <div style={{ width: '100%', height, marginTop: 8 }} aria-label={label || 'Sparkline trend chart'}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 3, right: 3, bottom: 3, left: 3 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={hex} stopOpacity={0.4} />
              <stop offset="100%" stopColor={hex} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Tooltip
            cursor={{ stroke: hex, strokeWidth: 1, strokeDasharray: '4 2' }}
            content={({ active, payload, label: idx }) => {
              if (!active || !payload?.length) return null;
              const val = Number(payload[0].value);
              return (
                <div
                  style={{
                    background: '#fff',
                    border: `1px solid ${hex}`,
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 11,
                    color: '#20263a',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ color: hex, fontWeight: 700 }}>
                    {val.toLocaleString()}
                  </span>
                  {' '}
                  <span style={{ color: '#65708a' }}>· point {idx + 1}</span>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke={hex}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 4, fill: hex, stroke: '#fff', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
