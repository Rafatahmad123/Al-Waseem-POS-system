'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface SalesTrendChartProps {
  data: any[]
}

export default function SalesTrendChart({ data }: SalesTrendChartProps) {
  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return 'N/A'
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return date.toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' })
    } catch {
      return 'Invalid Date'
    }
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={Array.isArray(data) ? data : []}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            stroke="#64748b"
            style={{ fontFamily: 'var(--font-tajawal)' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }} 
            stroke="#64748b"
            style={{ fontFamily: 'var(--font-tajawal)' }}
          />
          <Tooltip
            labelFormatter={(label: any) => formatDate(label)}
            formatter={(value: any) => [`$${(value ?? 0).toFixed(2)}`, 'المبيعات']}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontFamily: 'var(--font-tajawal)'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="amount" 
            stroke="#6366f1" 
            strokeWidth={3}
            fill="url(#colorAmount)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
