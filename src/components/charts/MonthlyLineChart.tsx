import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonthlyMetric } from '@/types'

interface MonthlyLineChartProps {
  data: MonthlyMetric[]
  color?: string
  unit?: string
}

export function MonthlyLineChart({
  data,
  color = 'var(--color-accent)',
  unit = '',
}: MonthlyLineChartProps) {
  const gradientId = `gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--color-border)"
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: '1px solid var(--color-border)',
              background: 'var(--color-card)',
              color: 'var(--color-foreground)',
              boxShadow: 'var(--shadow-soft)',
            }}
            formatter={(value) => [
              `${Number(value).toLocaleString('en-IN')}${unit ? ` ${unit}` : ''}`,
              'Value',
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
