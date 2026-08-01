'use client'

import { useState, useEffect } from 'react'
import { getExchangeRate, updateExchangeRate } from '@/app/actions/settings'

export default function SettingsPage() {
  const [exchangeRate, setExchangeRate] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadExchangeRate()
  }, [])

  async function loadExchangeRate() {
    setIsLoading(true)
    const rate = await getExchangeRate()
    if (rate !== null) {
      setExchangeRate(rate.toString())
    } else {
      // Set default if no rate exists
      setExchangeRate('')
    }
    setIsLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    const rate = parseFloat(exchangeRate)
    if (isNaN(rate) || rate <= 0) {
      setError('الرجاء إدخال سعر صرف صحيح')
      return
    }

    setIsSaving(true)
    const result = await updateExchangeRate(rate)
    setIsSaving(false)

    if (result.error) {
      setError(result.error)
    } else {
      setToastMessage('تم الحفظ بنجاح')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">الإعدادات</h1>
      </div>

        <div className="max-w-2xl">
          <div className="bg-slate-900 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">سعر الصرف</h2>
            
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="exchangeRate" className="block text-sm font-medium text-white mb-2">
                  سعر الصرف (دولار/ليرة)
                </label>
                <input
                  type="number"
                  id="exchangeRate"
                  step="0.01"
                  min="0"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  disabled={isLoading || isSaving}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="أدخل سعر الصرف"
                  required
                />
                {isLoading && (
                  <p className="mt-2 text-sm text-slate-400">جاري تحميل السعر الحالي...</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الحفظ...
                  </span>
                ) : (
                  'حفظ التغييرات'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-4 left-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 space-x-reverse animate-fade-in">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        )}

        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
        `}</style>
    </div>
  )
}
