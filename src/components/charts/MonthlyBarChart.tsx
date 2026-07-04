import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonthlyMetric } from '@/types'

interface MonthlyBarChartProps {
  data: MonthlyMetric[]
  color?: string
  unit?: string
}

export function MonthlyBarChart({
  data,
  color = 'var(--color-primary)',
  unit = '',
}: MonthlyBarChartProps) {
  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
            cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
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
          <Bar
            dataKey="value"
            fill={color}
            radius={[10, 10, 4, 4]}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
          />

        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
