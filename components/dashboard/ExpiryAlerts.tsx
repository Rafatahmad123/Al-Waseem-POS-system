'use client'

import { AlertTriangle, Calendar, Package, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ExpiringProduct {
  id: string
  name: string
  barcode: string
  current_stock: number
  expiry_date: string
  days_until_expiry: number
  expiry_status: 'expired' | 'critical' | 'warning' | 'ok'
  batch_quantity: number
}

interface ExpiryAlertsProps {
  expiringProducts: ExpiringProduct[]
}

export default function ExpiryAlerts({ expiringProducts }: ExpiryAlertsProps) {
  const criticalProducts = expiringProducts.filter(p => p.expiry_status === 'expired' || p.expiry_status === 'critical')
  const warningProducts = expiringProducts.filter(p => p.expiry_status === 'warning')

  if (expiringProducts.length === 0) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'bg-red-100 border-red-500 text-red-800'
      case 'critical':
        return 'bg-orange-100 border-orange-500 text-orange-800'
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800'
      default:
        return 'bg-green-100 border-green-500 text-green-800'
    }
  }

  const getStatusText = (status: string, days: number) => {
    switch (status) {
      case 'expired':
        return 'منتهي الصلاحية'
      case 'critical':
        return `ينتهي خلال ${Math.abs(days)} أيام`
      case 'warning':
        return `ينتهي خلال ${days} أيام`
      default:
        return 'ساري'
    }
  }

  return (
    <div className={`rounded-lg border-2 p-6 ${
      criticalProducts.length > 0 ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            criticalProducts.length > 0 ? 'bg-red-500' : 'bg-yellow-500'
          }`}>
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${
              criticalProducts.length > 0 ? 'text-red-900' : 'text-yellow-900'
            }`}>
              تنبيه انتهاء الصلاحية
            </h3>
            <p className={`text-sm ${
              criticalProducts.length > 0 ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {expiringProducts.length} منتج تنتهي صلاحيته قريباً
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/reports/expiry"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            criticalProducts.length > 0 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-yellow-600 text-white hover:bg-yellow-700'
          }`}
        >
          عرض التقرير
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {criticalProducts.slice(0, 3).map((product) => (
          <div
            key={`${product.id}-${product.expiry_date}`}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <Package className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{product.name}</p>
                <p className="text-sm text-slate-500">الكمية: {product.batch_quantity}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(product.expiry_status)}`}>
                {getStatusText(product.expiry_status, product.days_until_expiry)}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(product.expiry_date).toLocaleDateString('ar-SY')}
              </p>
            </div>
          </div>
        ))}

        {warningProducts.length > 0 && criticalProducts.length === 0 && (
          warningProducts.slice(0, 3).map((product) => (
            <div
              key={`${product.id}-${product.expiry_date}`}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Package className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">الكمية: {product.batch_quantity}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(product.expiry_status)}`}>
                  {getStatusText(product.expiry_status, product.days_until_expiry)}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(product.expiry_date).toLocaleDateString('ar-SY')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {expiringProducts.length > 3 && (
        <p className="text-sm text-slate-600 mt-4 text-center">
          +{expiringProducts.length - 3} منتجات أخرى تنتهي صلاحيتها قريباً
        </p>
      )}
    </div>
  )
}
