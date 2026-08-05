import { useMemo, useState, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector
} from 'recharts';
import EmptyState from '../EmptyState';

// Resolved hex colors for SVG rendering
const SEVERITY_HEX = {
  HIGH:    { fill: '#c22f2f', light: '#ffe7e7' },
  MEDIUM:  { fill: '#b07400', light: '#fff2d6' },
  LOW:     { fill: '#1f5fa8', light: '#dff0ff' },
  UNKNOWN: { fill: '#65708a', light: '#f1f1f1' },
};

const FALLBACK_PALETTE = ['#2251d1', '#2d7a2d', '#b07400', '#c22f2f', '#65708a'];

function getHex(name, index) {
  const entry = SEVERITY_HEX[(name || '').toUpperCase()];
  return entry ? entry.fill : FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

function groupBySeverity(items) {
  const map = new Map();
  for (const item of items) {
    const key = (item.severity || 'UNKNOWN').toUpperCase();
    map.set(key, (map.get(key) || 0) + 1);
  }
  const order = ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      const ai = order.indexOf(a), bi = order.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([name, value]) => ({ name, value }));
}

// Active (hovered) segment rendered larger with a glow ring
function ActiveShape(props) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.15}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      {/* Label line */}
      <text
        x={cx} y={cy - 10}
        textAnchor="middle"
        fill="#20263a"
        fontSize={14}
        fontWeight={700}
      >
        {value.toLocaleString()}
      </text>
      <text
        x={cx} y={cy + 10}
        textAnchor="middle"
        fill="#65708a"
        fontSize={11}
      >
        {payload.name} · {(percent * 100).toFixed(1)}%
      </text>
    </g>
  );
}

export default function SeverityDonutChart({ items = [], onSegmentClick }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const data  = useMemo(() => groupBySeverity(items), [items]);
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  const onPieEnter = useCallback((_, index) => setActiveIndex(index), []);
  const onPieLeave = useCallback(() => setActiveIndex(null), []);

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<span aria-hidden="true">🍩</span>}
        message="No data available for severity breakdown."
      />
    );
  }

  function handleClick(entry, index) {
    if (typeof onSegmentClick === 'function') onSegmentClick(entry.name);
  }

  return (
    <ResponsiveContainer width="100%" height={270}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="48%"
          innerRadius="48%"
          outerRadius="72%"
          paddingAngle={4}
          dataKey="value"
          nameKey="name"
          activeIndex={activeIndex}
          activeShape={ActiveShape}
          onMouseEnter={onPieEnter}
          onMouseLeave={onPieLeave}
          onClick={handleClick}
          style={{ cursor: typeof onSegmentClick === 'function' ? 'pointer' : 'default', outline: 'none' }}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={getHex(entry.name, index)}
              stroke="#ffffff"
              strokeWidth={2}
            />
          ))}
        </Pie>

        {/* Center total — only when nothing is hovered */}
        {activeIndex === null && (
          <text
            x="50%" y="48%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ pointerEvents: 'none' }}
          >
            <tspan x="50%" dy="-8" fontSize={20} fontWeight={700} fill="#20263a">
              {total.toLocaleString()}
            </tspan>
            <tspan x="50%" dy={20} fontSize={11} fill="#65708a">
              total
            </tspan>
          </text>
        )}

        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const { name, value } = payload[0];
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            const hex = getHex(name, 0);
            return (
              <div
                style={{
                  background: '#fff',
                  border: `1.5px solid ${hex}`,
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 12,
                  color: '#20263a',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                }}
              >
                <div style={{ fontWeight: 700, color: hex, marginBottom: 4 }}>{name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: '#65708a' }}>Count</span>
                  <span style={{ fontWeight: 700 }}>{value.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: '#65708a' }}>Share</span>
                  <span style={{ fontWeight: 700 }}>{pct}%</span>
                </div>
                {typeof onSegmentClick === 'function' && (
                  <div style={{ fontSize: 10, color: '#65708a', marginTop: 4, borderTop: '1px solid #d8deea', paddingTop: 4 }}>
                    Click to filter table
                  </div>
                )}
              </div>
            );
          }}
        />

        <Legend
          iconType="circle"
          iconSize={10}
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value, entry) => (
            <span style={{ color: '#20263a' }}>
              {value}
              <span style={{ color: '#65708a', marginLeft: 4 }}>
                ({entry.payload.value})
              </span>
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
