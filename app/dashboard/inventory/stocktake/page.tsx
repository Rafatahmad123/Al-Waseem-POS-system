'use client'

import { useState, useRef, useEffect } from 'react'
import { Barcode, Package, CheckCircle, XCircle, ArrowRight, Search, ChevronDown } from 'lucide-react'
import { getProductByBarcode, searchProducts, adjustStockForStocktake } from '@/app/actions/products'
import { normalizeNumberInput } from '@/lib/numberNormalization'

export default function StocktakePage() {
  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState<any>(null)
  const [physicalStock, setPhysicalStock] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Compute normalized physical stock value
  const normalizedPhysicalStock = product && physicalStock 
    ? (product.is_bulk 
        ? normalizeNumberInput(physicalStock) 
        : parseInt(normalizeNumberInput(physicalStock).toString()))
    : null

  const handleSearch = async () => {
    if (!barcode.trim()) return

    setIsScanning(true)
    setError('')
    setSuccess('')
    setProduct(null)
    setPhysicalStock('')
    setSearchResults([])
    setShowDropdown(false)

    const results = await searchProducts(barcode.trim())

    if (results.length === 0) {
      setError('المنتج غير موجود')
    } else if (results.length === 1) {
      // Single result - select it directly
      setProduct(results[0])
      setPhysicalStock(results[0].current_stock.toString())
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      // Multiple results - show dropdown
      setSearchResults(results)
      setShowDropdown(true)
    }

    setIsScanning(false)
    setBarcode('')
  }

  const handleSelectProduct = (selectedProduct: any) => {
    setProduct(selectedProduct)
    setPhysicalStock(selectedProduct.current_stock.toString())
    setSearchResults([])
    setShowDropdown(false)
    setError('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleAdjustment = async () => {
    if (!product || !physicalStock) return

    // Use parseFloat for bulk items, parseInt for regular items
    const physicalStockNum = product.is_bulk 
      ? normalizeNumberInput(physicalStock) 
      : parseInt(normalizeNumberInput(physicalStock).toString())
    
    if (isNaN(physicalStockNum) || physicalStockNum < 0) {
      setError(product.is_bulk 
        ? 'الوزن يجب أن يكون رقماً غير سالب' 
        : 'الكمية يجب أن تكون رقماً صحيحاً غير سالب')
      return
    }

    const currentStock = product.current_stock
    if (physicalStockNum === currentStock) {
      setError('لا يوجد فرق في المخزون')
      return
    }

    const notes = `Stocktake adjustment: ${currentStock} → ${physicalStockNum}`
    const result = await adjustStockForStocktake(product.id, physicalStockNum, notes)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess('تم تعديل المخزون بنجاح')
      setProduct(null)
      setPhysicalStock('')
      setBarcode('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (product) {
        handleAdjustment()
      } else if (showDropdown && searchResults.length > 0) {
        // Select first result from dropdown
        handleSelectProduct(searchResults[0])
      } else {
        handleSearch()
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setSearchResults([])
    }
  }

  const resetForm = () => {
    setProduct(null)
    setBarcode('')
    setPhysicalStock('')
    setError('')
    setSuccess('')
    setSearchResults([])
    setShowDropdown(false)
  }

  // Debounced search for autocomplete
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (barcode.trim().length >= 2 && !product) {
        const results = await searchProducts(barcode.trim())
        if (results.length > 1) {
          setSearchResults(results)
          setShowDropdown(true)
        } else if (results.length === 1) {
          setSearchResults([])
          setShowDropdown(false)
        }
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [barcode, product])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">جرد المخزون السريع</h2>
        <p className="text-slate-600 mt-1">مسح الباركود ومقارنة المخزون الفعلي بالنظام</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}

      {/* Barcode Scanner */}
      <div className="bg-white rounded-lg shadow border border-slate-200 p-6 relative">
        <div className="flex gap-4" ref={searchContainerRef}>
          <div className="flex-1 relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Search className="inline h-4 w-4 ml-1" />
              بحث عن منتج
            </label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="ابحث باسم المنتج أو أدخل/امسح الباركود..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              disabled={isScanning || !!product}
              autoFocus
            />

            {/* Search Results Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectProduct(result)}
                    className="w-full text-right px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{result.name}</div>
                        <div className="text-sm text-slate-600">الباركود: {result.barcode}</div>
                      </div>
                      <div className="text-left ml-4">
                        <div className="text-sm text-slate-900">{result.current_stock} {result.is_bulk ? 'kg' : ''}</div>
                        {result.is_bulk && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">بيع بالوزن</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-end">
            {!product ? (
              <button
                onClick={handleSearch}
                disabled={isScanning || !barcode.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400"
              >
                {isScanning ? 'جاري البحث...' : 'بحث'}
              </button>
            ) : (
              <button
                onClick={resetForm}
                className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-300 transition-colors"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Details */}
      {product && (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
              <p className="text-sm text-slate-600">الباركود: {product.barcode}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Stock */}
            <div className="bg-slate-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                مخزون النظام
              </label>
              <div className="text-3xl font-bold text-slate-900">
                {product.current_stock} {product.is_bulk ? 'kg' : ''}
              </div>
              <p className="text-sm text-slate-600 mt-1">الكمية المسجلة في النظام</p>
              {product.is_bulk && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded mt-2 inline-block">بيع بالوزن</span>
              )}
            </div>

            {/* Physical Stock Input */}
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                المخزون الفعلي {product.is_bulk ? '(kg)' : ''}
              </label>
              <input
                ref={inputRef}
                type="text"
                inputMode={product.is_bulk ? "decimal" : "numeric"}
                value={physicalStock}
                onChange={(e) => setPhysicalStock(e.target.value)}
                onKeyPress={handleKeyPress}
                min="0"
                className="w-full text-3xl font-bold text-blue-900 bg-transparent border-none focus:outline-none focus:ring-0"
                placeholder={product.is_bulk ? "أدخل الوزن (مثال: 1.5)" : "أدخل الكمية"}
              />
              <p className="text-sm text-slate-600 mt-1">
                {product.is_bulk ? 'الوزن الفعلي في المخزن (kg)' : 'الكمية الفعلية في المخزن'}
              </p>
            </div>
          </div>

          {/* Adjustment Preview */}
          {physicalStock && normalizedPhysicalStock !== null && normalizedPhysicalStock !== product.current_stock && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-800">الفرق المتوقع</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {(normalizedPhysicalStock > product.current_stock ? '+' : '')}
                    {normalizedPhysicalStock - product.current_stock}
                    {product.is_bulk ? ' kg' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-yellow-700">
                    {normalizedPhysicalStock > product.current_stock
                      ? 'زيادة في المخزون'
                      : 'نقص في المخزون'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6">
            <button
              onClick={handleAdjustment}
              disabled={!physicalStock || normalizedPhysicalStock === null || normalizedPhysicalStock === product.current_stock}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-400 flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              تأكيد التعديل
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">تعليمات الاستخدام</h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>ابحث عن المنتج بالاسم أو أدخل/امسح الباركود</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>إذا ظهرت قائمة منتجات، اختر المنتج المطلوب منها</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>سيظهر مخزون النظام الحالي للمنتج</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>أدخل الكمية الفعلية الموجودة في المخزن</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">5.</span>
            <span>اضغط على "تأكيد التعديل" لتحديث المخزون</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">6.</span>
            <span>سيتم تسجيل التعديل في سجل المخزون تلقائياً</span>
          </li>
        </ol>
      </div>
    </div>
  )
}
