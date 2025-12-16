'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardChartPoint } from '@/lib/dashboardCharts';

type DashboardChartProps = {
  data: DashboardChartPoint[];
  chartType?: string | null;
  valueLabel: string;
};

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

function formatValue(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }
  return numberFormatter.format(value);
}

function buildTooltipLabel(payload?: DashboardChartPoint) {
  if (!payload) return '';
  return `${payload.label}`;
}

export function DashboardChart({ data, chartType = 'line', valueLabel }: DashboardChartProps) {
  const normalizedType = chartType?.toLowerCase() ?? 'line';

  const commonChildren = (
    <>
      <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
      <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} />
      <YAxis
        stroke="#94a3b8"
        tickLine={false}
        width={70}
        tickFormatter={(value) => formatValue(Number(value))}
      />
      <Tooltip
        content={({ payload }) => {
          const point = payload?.[0]?.payload as DashboardChartPoint | undefined;
          if (!point) {
            return null;
          }
          return (
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
              <div className="font-semibold text-gray-900">{buildTooltipLabel(point)}</div>
              <div className="text-gray-600">
                {valueLabel}: <span className="font-semibold text-indigo-600">{formatValue(point.value)}</span>
              </div>
            </div>
          );
        }}
      />
    </>
  );

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {normalizedType === 'area' ? (
          <AreaChart data={data}>
            {commonChildren}
            <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="rgba(79,70,229,0.15)" strokeWidth={3} />
          </AreaChart>
        ) : (normalizedType === 'bar' ? (
          <BarChart data={data}>
            {commonChildren}
            <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data}>
            {commonChildren}
            <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        ))}
      </ResponsiveContainer>
    </div>
  );
}
