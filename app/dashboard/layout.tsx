'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Settings,
  FileText,
  Menu,
  X,
  Plus,
  DollarSign,
  ArrowRight,
  Shield,
  RotateCcw
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showDeveloperModal, setShowDeveloperModal] = useState(false)

  const navItems = [
    {
      category: 'الإدارة',
      items: [
        { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
        { href: '/dashboard/categories', label: 'التصنيفات', icon: Package },
        { href: '/dashboard/products', label: 'المنتجات', icon: Package },
        { href: '/dashboard/inventory/stocktake', label: 'جرد المخزون', icon: Package },
      ]
    },
    {
      category: 'المبيعات',
      items: [
        { href: '/dashboard/customers', label: 'العملاء', icon: Users },
        { href: '/dashboard/sales', label: 'المبيعات', icon: ShoppingCart },
        { href: '/dashboard/sales/returns', label: 'مرتجع المبيعات', icon: RotateCcw },
        { href: '/dashboard/purchases', label: 'المشتريات', icon: ShoppingCart },
      ]
    },
    {
      category: 'المالية',
      items: [
        { href: '/dashboard/expenses', label: 'المصروفات', icon: DollarSign },
      ]
    },
    {
      category: 'التقارير',
      items: [
        { href: '/dashboard/reports', label: 'التقارير', icon: FileText },
        { href: '/dashboard/reports/expiry', label: 'انتهاء الصلاحية', icon: FileText },
        { href: '/dashboard/reports/turnover', label: 'دوران المخزون', icon: TrendingUp },
      ]
    },
    {
      category: 'الإعدادات',
      items: [
        { href: '/dashboard/settings', label: 'الإعدادات', icon: Settings },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 font-sans">
      {/* Mobile Header */}
      <header className="lg:hidden bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-white hover:text-slate-200"
              >
                <Menu className="h-6 w-6" />
              </button>
              <Link href="/dashboard" className="text-white font-bold text-xl">
                ماركت ومحمصة الخلود
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 bg-gradient-to-b from-indigo-900 to-indigo-950 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-indigo-800">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="text-white font-bold text-2xl">
                ماركت ومحمصة الخلود
              </Link>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden text-white hover:text-slate-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            {navItems.map((section) => (
              <div key={section.category}>
                <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-3 px-3">
                  {section.category}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-indigo-100 hover:bg-indigo-800 hover:text-white transition-all duration-200 group"
                    >
                      <item.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-indigo-800 space-y-2">
            <button
              onClick={() => setShowDeveloperModal(true)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-indigo-200 hover:bg-indigo-800 hover:text-white transition-all duration-200 text-sm"
            >
              <Shield className="h-4 w-4" />
              <span className="font-medium">Developed by Eng. Raafat Mansour Ahmad</span>
            </button>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-indigo-100 hover:bg-red-600 hover:text-white transition-all duration-200"
              >
                <ArrowRight className="h-5 w-5" />
                <span className="font-medium">تسجيل الخروج</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:mr-72 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Developer Bio Modal */}
      {showDeveloperModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Eng. Raafat Mansour Ahmad</h3>
                    <p className="text-indigo-100">Software Engineer & Cybersecurity Specialist</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeveloperModal(false)}
                  className="text-white hover:text-indigo-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Arabic Bio */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
                <h4 className="text-lg font-bold text-indigo-900 mb-3">
                  السيرة الذاتية
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  المهندس رأفت منصور أحمد: مهندس برمجيات ودبلوم متخصص في الأمن السيبراني . خبير في بناء الحلول البرمجية المتقدمة وأنظمة إدارة الموارد (ERP) عالية الأداء. مكرس لتقديم تحولات رقمية مبتكرة تجمع بين الكفاءة والأمان.
                </p>
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <a
                    href="https://wa.me/963936457500"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
                  >
                    <span className="text-lg">💬</span>
                    <span>0936457500</span>
                  </a>
                </div>
              </div>

              {/* English Bio */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                <h4 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🌍</span>
                  Biography
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  Eng. Raafat Mansour Ahmad: Software Engineer & Cybersecurity Specialist (Diploma). Expert in building high-performance enterprise solutions and ERP systems. Dedicated to delivering innovative digital transformations that balance efficiency with robust security.
                </p>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <span className="text-2xl">🛡️</span>
                <span className="font-semibold text-emerald-800">Security Audited & Hardened System</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => setShowDeveloperModal(false)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
