import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import EmptyState from '../EmptyState';

const TOP_N = 10;

// Color ramp from highest-count (amber/orange) to lower (blue shades)
const RAMP = [
  '#c22f2f', // #1 — loudest, red-orange
  '#b07400', // #2 — amber
  '#2251d1', // #3
  '#1f5fa8', // #4
  '#2d7a2d', // #5
  '#4b8ec2', // #6
  '#5a6e9a', // #7
  '#7a85a3', // #8
  '#94a3b8', // #9
  '#b0bac9', // #10
];

function barColor(index) {
  return RAMP[Math.min(index, RAMP.length - 1)];
}

function deriveRuleCounts(alerts, rules) {
  const rulesById = new Map((rules || []).map((r) => [String(r.id), r]));
  const countMap  = new Map();
  for (const alert of alerts) {
    const key  = alert.ruleId != null ? String(alert.ruleId) : null;
    const name =
      (key && rulesById.get(key)?.ruleName) ||
      alert.ruleName ||
      (key ? `Rule #${key}` : 'Unknown');
    countMap.set(name, (countMap.get(name) || 0) + 1);
  }
  return Array.from(countMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export default function RuleTriggerFrequencyChart({ alerts = [], rules = [], onBarClick }) {
  const { topRules, overflow, grandTotal } = useMemo(() => {
    const all = deriveRuleCounts(alerts, rules);
    return {
      topRules:   all.slice(0, TOP_N),
      overflow:   Math.max(0, all.length - TOP_N),
      grandTotal: all.reduce((s, r) => s + r.count, 0),
    };
  }, [alerts, rules]);

  if (topRules.length === 0) {
    return (
      <EmptyState
        icon={<span aria-hidden="true">📊</span>}
        message="No rule trigger data available."
      />
    );
  }

  const chartHeight = Math.max(220, topRules.length * 40 + 40);
  const maxCount    = topRules[0]?.count || 1;

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontSize: 11, color: '#65708a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total triggers</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#20263a' }}>{grandTotal.toLocaleString()}</div>
        </div>
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontSize: 11, color: '#65708a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rules ranked</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#20263a' }}>{topRules.length + overflow}</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={topRules}
          layout="vertical"
          margin={{ top: 4, right: 56, bottom: 4, left: 8 }}
          barCategoryGap="22%"
        >
          <CartesianGrid strokeDasharray="4 4" stroke="#d8deea" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#65708a' }}
            tickLine={false}
            axisLine={{ stroke: '#d8deea' }}
            domain={[0, maxCount + 1]}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={145}
            tick={{ fontSize: 11, fill: '#20263a' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(34,81,209,0.06)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const { name, count } = payload[0].payload;
              const pct = grandTotal > 0 ? ((count / grandTotal) * 100).toFixed(1) : '0';
              const hex = barColor(topRules.findIndex((r) => r.name === name));
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
                    maxWidth: 220,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6, wordBreak: 'break-word' }}>{name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
                    <span style={{ color: '#65708a' }}>Triggers</span>
                    <span style={{ fontWeight: 700, color: hex }}>{count.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ color: '#65708a' }}>Share</span>
                    <span style={{ fontWeight: 700 }}>{pct}%</span>
                  </div>
                  {typeof onBarClick === 'function' && (
                    <div style={{ fontSize: 10, color: '#65708a', marginTop: 4, borderTop: '1px solid #d8deea', paddingTop: 4 }}>
                      Click to filter rule list
                    </div>
                  )}
                </div>
              );
            }}
          />
          <Bar
            dataKey="count"
            name="Triggers"
            radius={[0, 6, 6, 0]}
            onClick={(entry) => typeof onBarClick === 'function' && onBarClick(entry.name)}
            style={{ cursor: typeof onBarClick === 'function' ? 'pointer' : 'default' }}
            isAnimationActive={true}
            animationDuration={600}
          >
            {topRules.map((entry, index) => (
              <Cell key={entry.name} fill={barColor(index)} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              style={{ fontSize: 11, fontWeight: 700, fill: '#20263a' }}
              formatter={(v) => v.toLocaleString()}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {overflow > 0 && (
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#65708a', textAlign: 'right' }}>
          …and {overflow} more rule{overflow === 1 ? '' : 's'} not shown
        </p>
      )}
    </div>
  );
}
