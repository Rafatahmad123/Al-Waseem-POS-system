'use client'

import { useState, useEffect } from 'react'
import { DollarSign, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react'
import AdminGate from '@/components/AdminGate'
import { getExchangeRate } from '@/lib/pricing'

interface SensitiveStatsCardsProps {
  todaySalesUSD: number
  todayNetProfit: number
  monthNetProfit: number
}

export default function SensitiveStatsCards({ todaySalesUSD, todayNetProfit, monthNetProfit }: SensitiveStatsCardsProps) {
  const [exchangeRate, setExchangeRate] = useState<number>(12500)

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const rate = await getExchangeRate()
        if (rate) setExchangeRate(rate)
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error)
      }
    }
    fetchExchangeRate()
  }, [])

  const todaySalesSYP = (todaySalesUSD ?? 0) * exchangeRate

  return (
    <AdminGate>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales */}
        <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                <span>+12%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">مبيعات اليوم</p>
            <p className="text-3xl font-bold text-slate-900">
              ${(todaySalesUSD ?? 0).toFixed(2)}
            </p>
            <p className="text-lg font-semibold text-indigo-600 mt-1">
              {todaySalesSYP.toLocaleString()} SYP
            </p>
          </div>
        </div>

        {/* Daily Net Profit */}
        <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className={`bg-gradient-to-br ${(todayNetProfit ?? 0) >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} p-3 rounded-xl shadow-lg`}>
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 ${(todayNetProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'} text-sm font-medium`}>
                {(todayNetProfit ?? 0) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{(todayNetProfit ?? 0) >= 0 ? '+8%' : '-5%'}</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">صافي الربح اليومي</p>
            <p className={`text-3xl font-bold ${(todayNetProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ${(todayNetProfit ?? 0).toFixed(2)}
            </p>
            <p className={`text-lg font-semibold ${(todayNetProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'} mt-1`}>
              {((todayNetProfit ?? 0) * exchangeRate).toLocaleString()} SYP
            </p>
          </div>
        </div>

        {/* Monthly Net Profit */}
        <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className={`bg-gradient-to-br ${(monthNetProfit ?? 0) >= 0 ? 'from-purple-500 to-purple-600' : 'from-red-500 to-red-600'} p-3 rounded-xl shadow-lg`}>
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 ${(monthNetProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'} text-sm font-medium`}>
                {(monthNetProfit ?? 0) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{(monthNetProfit ?? 0) >= 0 ? '+15%' : '-2%'}</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">صافي الربح الشهري</p>
            <p className={`text-3xl font-bold ${(monthNetProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ${(monthNetProfit ?? 0).toFixed(2)}
            </p>
            <p className={`text-lg font-semibold ${(monthNetProfit ?? 0) >= 0 ? 'text-purple-600' : 'text-red-600'} mt-1`}>
              {((monthNetProfit ?? 0) * exchangeRate).toLocaleString()} SYP
            </p>
          </div>
        </div>
      </div>
    </AdminGate>
  )
}
