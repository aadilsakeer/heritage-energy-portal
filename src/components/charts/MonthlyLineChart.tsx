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
import { formatCurrency, formatEnergy, formatPercent } from '@/utils/format'

interface MonthlyLineChartProps {
  data: MonthlyMetric[]
  color?: string
  unit?: string
}

function formatTooltipValue(value: number, unit: string): string {
  if (unit === '₹') return formatCurrency(value)
  if (unit === '%') return formatPercent(value)
  if (unit === 'kWh') return formatEnergy(value)
  return `${Number(value).toLocaleString('en-IN')}${unit ? ` ${unit}` : ''}`
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
              formatTooltipValue(Number(value), unit),
              'Value',
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
