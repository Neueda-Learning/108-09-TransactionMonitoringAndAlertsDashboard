import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
  ResponsiveContainer,
  Legend
} from 'recharts';
import EmptyState from '../EmptyState';

// Resolved hex colors — CSS vars don't work inside SVG gradients
const C = {
  primary:     '#2251d1',
  primaryFill: '#c7d5f9',
  success:     '#2d7a2d',
  successFill: '#c3edbe',
  border:      '#d8deea',
  muted:       '#65708a',
  text:        '#20263a',
  surface:     '#ffffff',
  surfaceSubt: '#eef1f7',
};

function bucketByDay(transactions) {
  const map = new Map();
  for (const tx of transactions) {
    const raw = tx.transactionTime || tx.createdAt || tx.date;
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    const slot = map.get(key) || { date: key, count: 0, totalValue: 0 };
    slot.count += 1;
    slot.totalValue = Math.round((slot.totalValue + Number(tx.amount || 0)) * 100) / 100;
    map.set(key, slot);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

const fmtDate = (iso) => {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const fmtMoney = (v) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(v);

const fmtAxisMoney = (v) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
};

export default function TransactionVolumeChart({ transactions = [] }) {
  const data = useMemo(() => bucketByDay(transactions), [transactions]);

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<span aria-hidden="true">📈</span>}
        message="No transaction data available for the volume chart."
      />
    );
  }

  const totalTx  = data.reduce((s, d) => s + d.count, 0);
  const totalVal = data.reduce((s, d) => s + d.totalValue, 0);

  return (
    <div>
      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Total transactions', value: totalTx.toLocaleString() },
          { label: 'Total value',        value: fmtMoney(totalVal) },
          { label: 'Days with data',     value: data.length },
        ].map(({ label, value }) => (
          <div key={label} style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{value}</div>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 8, right: 20, bottom: 4, left: 8 }}>
          <defs>
            <linearGradient id="volGradCount2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={C.primary}     stopOpacity={0.35} />
              <stop offset="100%" stopColor={C.primaryFill} stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="volGradValue2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={C.success}     stopOpacity={0.35} />
              <stop offset="100%" stopColor={C.successFill} stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="4 4" stroke={C.border} vertical={false} />

          <XAxis
            dataKey="date"
            tickFormatter={(v) => {
              const d = new Date(v + 'T12:00:00');
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }}
            tick={{ fontSize: 11, fill: C.muted }}
            tickLine={false}
            axisLine={{ stroke: C.border }}
            minTickGap={40}
          />
          <YAxis
            yAxisId="count"
            orientation="left"
            tick={{ fontSize: 11, fill: C.muted }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={36}
          />
          <YAxis
            yAxisId="value"
            orientation="right"
            tick={{ fontSize: 11, fill: C.muted }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtAxisMoney}
            width={52}
          />

          <Tooltip
            cursor={{ stroke: C.primary, strokeWidth: 1.5, strokeDasharray: '5 3' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const count = payload.find((p) => p.dataKey === 'count')?.value ?? 0;
              const val   = payload.find((p) => p.dataKey === 'totalValue')?.value ?? 0;
              return (
                <div
                  style={{
                    background: C.surface,
                    border: `1.5px solid ${C.primary}`,
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 12,
                    color: C.text,
                    boxShadow: '0 4px 16px rgba(34,81,209,0.12)',
                    minWidth: 160,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6, color: C.text }}>{fmtDate(label)}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
                    <span style={{ color: C.muted }}>Transactions</span>
                    <span style={{ fontWeight: 700, color: C.primary }}>{count.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ color: C.muted }}>Total Value</span>
                    <span style={{ fontWeight: 700, color: C.success }}>{fmtMoney(val)}</span>
                  </div>
                </div>
              );
            }}
          />

          <Legend
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: 12, paddingTop: 4, color: C.text }}
            formatter={(value) => (
              <span style={{ color: C.text }}>{value}</span>
            )}
          />

          <Area
            yAxisId="count"
            type="monotone"
            dataKey="count"
            name="Transactions"
            stroke={C.primary}
            strokeWidth={2.5}
            fill="url(#volGradCount2)"
            dot={false}
            activeDot={{ r: 5, fill: C.primary, stroke: C.surface, strokeWidth: 2 }}
          />
          <Area
            yAxisId="value"
            type="monotone"
            dataKey="totalValue"
            name="Total Value"
            stroke={C.success}
            strokeWidth={2.5}
            fill="url(#volGradValue2)"
            dot={false}
            activeDot={{ r: 5, fill: C.success, stroke: C.surface, strokeWidth: 2 }}
          />

          <Brush
            dataKey="date"
            height={24}
            stroke={C.border}
            fill={C.surfaceSubt}
            travellerWidth={8}
            tickFormatter={(v) => {
              const d = new Date(v + 'T12:00:00');
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }}
            startIndex={Math.max(0, data.length - 30)}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p style={{ fontSize: 11, color: C.muted, textAlign: 'right', marginTop: 4 }}>
        Drag the slider below the chart to zoom into a date range
      </p>
    </div>
  );
}
