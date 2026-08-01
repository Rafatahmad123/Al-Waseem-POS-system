'use client'

import { useState } from 'react'
import { Lock, Unlock } from 'lucide-react'

interface AdminGateProps {
  children: React.ReactNode
}

const ADMIN_PASSWORD = '123456'

export default function AdminGate({ children }: AdminGateProps) {
  const [password, setPassword] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [error, setError] = useState('')

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsUnlocked(true)
      setError('')
    } else {
      setError('كلمة المرور غير صحيحة')
      setPassword('')
    }
  }

  if (isUnlocked) {
    return <>{children}</>
  }

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="bg-slate-100 p-4 rounded-full">
          <Lock className="h-8 w-8 text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">منطقة محمية</h3>
        <p className="text-sm text-slate-600 text-center max-w-xs">
          هذا القسم يحتوي على معلومات مالية حساسة. يرجى إدخال كلمة المرور للمتابعة.
        </p>
        <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            إلغاء القفل
          </button>
        </form>
      </div>
    </div>
  )
}
