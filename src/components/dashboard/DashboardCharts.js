'use client'

import React, { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '../../context/ThemeContext'
import {
  buildStatusBreakdown,
  buildTypeBreakdown,
  buildUploadTrend,
} from './dashboardUtils'

function ChartTooltip ({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="dash-chart-tooltip">
      <p className="dash-chart-tooltip__label">{label}</p>
      <p className="dash-chart-tooltip__value tabular-nums">{payload[0].value}</p>
    </div>
  )
}

function EmptyChart ({ message }) {
  return (
    <div className="dash-chart-empty">
      <p>{message}</p>
    </div>
  )
}

export function DashboardCharts ({ documents }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const axisColor = isDark ? 'oklch(0.55 0 0)' : 'oklch(0.52 0 0)'
  const gridColor = isDark ? 'oklch(0.24 0 0)' : 'oklch(0.905 0 0)'

  const trendData = useMemo(() => buildUploadTrend(documents), [documents])
  const statusData = useMemo(() => buildStatusBreakdown(documents), [documents])
  const typeData = useMemo(() => buildTypeBreakdown(documents), [documents])

  const trendTotal = trendData.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="dash-charts-grid">
      <section className="shell-card dash-chart-card dash-chart-card--wide">
        <div className="shell-card__header dash-chart-card__header">
          <div>
            <p className="eyebrow">Upload trend</p>
            <p className="dash-chart-card__sub tabular-nums">Last 14 days · {trendTotal} uploads</p>
          </div>
        </div>
        <div className="shell-card__divider" />
        <div className="shell-card__body dash-chart-card__body">
          {trendTotal === 0 ? (
            <EmptyChart message="No uploads in the last 14 days." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="uploadTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1a8060" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#1a8060" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: axisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: gridColor }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#1a8060"
                  strokeWidth={2}
                  fill="url(#uploadTrendFill)"
                  isAnimationActive
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="shell-card dash-chart-card">
        <div className="shell-card__header dash-chart-card__header">
          <p className="eyebrow">Status</p>
        </div>
        <div className="shell-card__divider" />
        <div className="shell-card__body dash-chart-card__body">
          {statusData.length === 0 ? (
            <EmptyChart message="No reports yet." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: axisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: isDark ? 'oklch(0.22 0 0)' : 'oklch(0.94 0 0)' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18} isAnimationActive animationDuration={800}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="shell-card dash-chart-card">
        <div className="shell-card__header dash-chart-card__header">
          <p className="eyebrow">Document types</p>
        </div>
        <div className="shell-card__divider" />
        <div className="shell-card__body dash-chart-card__body">
          {typeData.length === 0 ? (
            <EmptyChart message="Types appear after analysis completes." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: axisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={96}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: isDark ? 'oklch(0.22 0 0)' : 'oklch(0.94 0 0)' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18} isAnimationActive animationDuration={800}>
                  {typeData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  )
}
