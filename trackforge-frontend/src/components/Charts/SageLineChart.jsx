import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const ChartTooltip = ({ active, payload, label, valueLabel }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-border/70 bg-surface/90 px-3 py-2 text-xs shadow-paper backdrop-blur-xl">
      {label && <p className="mb-1 font-black text-white">{label}</p>}
      <p className="font-semibold text-slate-500">
        {valueLabel || payload[0].name}: <span className="text-white">{payload[0].value}</span>
      </p>
    </div>
  );
};

const SageLineChart = ({
  data = [],
  dataKey = 'value',
  xKey = 'label',
  height = 180,
  valueLabel,
  showYAxis = false,
  compact = false
}) => {
  if (!data.length) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-border/70 bg-background/35 text-center text-xs text-slate-500" style={{ height }}>
        No trend data yet
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: showYAxis ? -18 : 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sageLineFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#88BDA4" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#88BDA4" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgb(var(--color-border) / 0.45)" strokeDasharray="4 6" vertical={false} />
          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            interval={compact ? 'preserveStartEnd' : 0}
            tick={{ fill: 'rgb(var(--color-text-muted))', fontSize: compact ? 9 : 10, fontWeight: 700 }}
            minTickGap={compact ? 12 : 4}
          />
          <YAxis
            hide={!showYAxis}
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgb(var(--color-text-muted))', fontSize: 10 }}
          />
          <Tooltip content={<ChartTooltip valueLabel={valueLabel} />} cursor={{ stroke: '#88BDA4', strokeOpacity: 0.35 }} />
          <Area type="monotone" dataKey={dataKey} fill="url(#sageLineFill)" stroke="none" />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#6F998F"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: '#88BDA4', stroke: 'rgb(var(--color-surface))', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SageLineChart;
