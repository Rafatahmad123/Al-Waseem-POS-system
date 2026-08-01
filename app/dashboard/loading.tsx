import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-6 w-48 mt-2" />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 flex-wrap">
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-12 w-32" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-80 w-full" />
      </div>

      {/* Low Stock Items */}
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
