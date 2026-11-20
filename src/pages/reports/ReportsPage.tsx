import { useQuery } from '@tanstack/react-query'
import * as jalaali from 'jalaali-js'
import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  HiOutlineChartBar,
  HiOutlineCurrencyDollar,
  HiOutlineDownload,
  HiOutlineExclamation,
  HiOutlineShoppingBag,
  HiOutlineUserGroup,
} from 'react-icons/hi'

import { reportService } from '@/services/reportService'
import { ReportTab } from '@/types/report'

import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import PersianDatePicker from '@/components/ui/PersianDatePicker'
import StatCard from '@/components/ui/StatCard'

const tabs: { id: ReportTab; label: string; icon: React.ElementType }[] = [
  { id: 'sales', label: 'گزارش فروش', icon: HiOutlineChartBar },
  { id: 'inventory', label: 'موجودی انبار', icon: HiOutlineShoppingBag },
  { id: 'customer-balance', label: 'مانده مشتریان', icon: HiOutlineUserGroup },
  {
    id: 'supplier-balance',
    label: 'مانده تامین‌کنندگان',
    icon: HiOutlineUserGroup,
  },
  { id: 'profit-loss', label: 'سود و زیان', icon: HiOutlineCurrencyDollar },
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales')
  const [groupBy, setGroupBy] = useState<'day' | 'month' | 'year'>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  // تبدیل تاریخ شمسی به میلادی (فرمت datetime برای API)
  const convertJalaliToGregorian = (jalaliDate: string): string | null => {
    if (!jalaliDate) return null
    try {
      const [jYear, jMonth, jDay] = jalaliDate.split('/').map(Number)
      const gDate = jalaali.toGregorian(jYear, jMonth, jDay)
      // اضافه کردن زمان برای فرمت datetime
      return `${gDate.gy}-${String(gDate.gm).padStart(2, '0')}-${String(gDate.gd).padStart(2, '0')}T00:00:00`
    } catch (error) {
      console.error('خطا در تبدیل تاریخ:', error)
      return null
    }
  }

  // تبدیل تاریخ میلادی به شمسی برای نمایش
  const convertGregorianToJalali = (gregorianDate: string): string => {
    if (!gregorianDate) return ''
    try {
      // اگر فرمت datetime بود، فقط تاریخ را بگیر
      const datePart = gregorianDate.split('T')[0]
      const parts = datePart.split('-').map(Number)

      if (parts.length === 3) {
        // فرمت کامل: YYYY-MM-DD
        const [gYear, gMonth, gDay] = parts
        const jDate = jalaali.toJalaali(gYear, gMonth, gDay)
        return `${jDate.jy}/${String(jDate.jm).padStart(2, '0')}/${String(jDate.jd).padStart(2, '0')}`
      } else if (parts.length === 2) {
        // فرمت سال-ماه: YYYY-MM
        const [gYear, gMonth] = parts
        const jDate = jalaali.toJalaali(gYear, gMonth, 1)
        return `${jDate.jy}/${String(jDate.jm).padStart(2, '0')}`
      } else if (parts.length === 1) {
        // فقط سال: YYYY
        const [gYear] = parts
        const jDate = jalaali.toJalaali(gYear, 1, 1)
        return `${jDate.jy}`
      }

      return gregorianDate
    } catch (error) {
      console.error('خطا در تبدیل تاریخ:', error)
      return gregorianDate
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fa-IR').format(Math.round(price))

  // Sales Report
  const {
    data: salesReport,
    isLoading: salesLoading,
    error: salesError,
  } = useQuery({
    queryKey: ['reports', 'sales', groupBy, startDate, endDate],
    queryFn: () => {
      const gStartDate = convertJalaliToGregorian(startDate)
      const gEndDate = convertJalaliToGregorian(endDate)
      console.log('📅 Sales Report - Jalali dates:', { startDate, endDate })
      console.log('📅 Sales Report - Gregorian dates:', {
        gStartDate,
        gEndDate,
      })
      return reportService.getSalesReport({
        group_by: groupBy,
        start_date: gStartDate || undefined,
        end_date: gEndDate || undefined,
      })
    },
    enabled: activeTab === 'sales',
  })

  // Inventory Report
  const { data: inventoryReport, isLoading: inventoryLoading } = useQuery({
    queryKey: ['reports', 'inventory', lowStockOnly],
    queryFn: () =>
      reportService.getInventoryReport({ low_stock_only: lowStockOnly }),
    enabled: activeTab === 'inventory',
  })

  // Customer Balance
  const { data: customerBalance, isLoading: customerLoading } = useQuery({
    queryKey: ['reports', 'customer-balance'],
    queryFn: () => reportService.getCustomerBalanceReport(),
    enabled: activeTab === 'customer-balance',
  })

  // Supplier Balance
  const { data: supplierBalance, isLoading: supplierLoading } = useQuery({
    queryKey: ['reports', 'supplier-balance'],
    queryFn: () => reportService.getSupplierBalanceReport(),
    enabled: activeTab === 'supplier-balance',
  })

  // Profit/Loss
  const { data: profitLoss, isLoading: profitLoading } = useQuery({
    queryKey: ['reports', 'profit-loss', startDate, endDate],
    queryFn: () => {
      const gStartDate = convertJalaliToGregorian(startDate)
      const gEndDate = convertJalaliToGregorian(endDate)
      console.log('📅 Profit/Loss - Jalali dates:', { startDate, endDate })
      console.log('📅 Profit/Loss - Gregorian dates:', { gStartDate, gEndDate })
      return reportService.getProfitLossReport({
        start_date: gStartDate || undefined,
        end_date: gEndDate || undefined,
      })
    },
    enabled: activeTab === 'profit-loss',
  })

  const handleDownloadExcel = async () => {
    try {
      let blob: Blob
      const gStartDate = convertJalaliToGregorian(startDate)
      const gEndDate = convertJalaliToGregorian(endDate)

      if (activeTab === 'sales') {
        blob = await reportService.downloadSalesExcel({
          group_by: groupBy,
          start_date: gStartDate || undefined,
          end_date: gEndDate || undefined,
        })
      } else if (activeTab === 'inventory') {
        blob = await reportService.downloadInventoryExcel({
          low_stock_only: lowStockOnly,
        })
      } else {
        toast.error('خروجی Excel فقط برای گزارش فروش و موجودی موجود است')
        return
      }

      if (blob.size === 0) {
        toast.error('فایل خالی است')
        return
      }

      const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer())
      if (
        signature[0] !== 0x50 ||
        signature[1] !== 0x4b ||
        signature[2] !== 0x03 ||
        signature[3] !== 0x04
      ) {
        toast.error('پاسخ سرور یک فایل Excel معتبر نیست')
        return
      }

      const excelBlob = new Blob([blob], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(excelBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${activeTab}_report.xlsx`
      document.body.appendChild(link)
      link.click()
      window.setTimeout(() => {
        link.remove()
        window.URL.revokeObjectURL(url)
      }, 1000)
      toast.success('فایل Excel دانلود شد')
    } catch (error: any) {
      console.error('Download error:', error)
      toast.error(error.response?.data?.detail || 'خطا در دانلود فایل')
    }
  }

  const isLoading =
    salesLoading ||
    inventoryLoading ||
    customerLoading ||
    supplierLoading ||
    profitLoading

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">گزارشات</h1>
          <p className="text-gray-500 mt-1">نمایش و تحلیل داده‌های سیستم</p>
        </div>
        {(activeTab === 'sales' || activeTab === 'inventory') && (
          <button
            onClick={handleDownloadExcel}
            className="btn-primary flex items-center gap-2"
          >
            <HiOutlineDownload className="w-5 h-5" />
            خروجی Excel
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {(activeTab === 'sales' || activeTab === 'profit-loss') && (
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاریخ شروع
              </label>
              <PersianDatePicker
                value={startDate}
                onChange={(value) => setStartDate(value)}
                placeholder="انتخاب تاریخ شروع"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاریخ پایان
              </label>
              <PersianDatePicker
                value={endDate}
                onChange={(value) => setEndDate(value)}
                placeholder="انتخاب تاریخ پایان"
              />
            </div>
            {activeTab === 'sales' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  گروه‌بندی
                </label>
                <select
                  value={groupBy}
                  onChange={(e) =>
                    setGroupBy(e.target.value as 'day' | 'month' | 'year')
                  }
                  className="input-field"
                >
                  <option value="day">روزانه</option>
                  <option value="month">ماهانه</option>
                  <option value="year">سالانه</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="card mb-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="lowStock"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <label
              htmlFor="lowStock"
              className="text-sm font-medium text-gray-700"
            >
              فقط کالاهای با موجودی کم
            </label>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Sales Report */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              {salesError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600">خطا در بارگذاری گزارش فروش</p>
                </div>
              )}
              {salesReport && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                      title="جمع فروش"
                      value={`${formatPrice(salesReport.data.reduce((sum, d) => sum + d.total_sales, 0))} تومان`}
                      icon={<HiOutlineCurrencyDollar className="w-6 h-6" />}
                      color="green"
                    />
                    <StatCard
                      title="جمع دریافتی"
                      value={`${formatPrice(salesReport.data.reduce((sum, d) => sum + d.total_paid, 0))} تومان`}
                      icon={<HiOutlineCurrencyDollar className="w-6 h-6" />}
                      color="blue"
                    />
                    <StatCard
                      title="جمع مانده"
                      value={`${formatPrice(salesReport.data.reduce((sum, d) => sum + d.total_remaining, 0))} تومان`}
                      icon={<HiOutlineCurrencyDollar className="w-6 h-6" />}
                      color="red"
                    />
                  </div>

                  <div className="card overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                            تاریخ
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                            تعداد فاکتور
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                            جمع فروش
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                            دریافتی
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                            مانده
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {salesReport.data.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-800">
                              {convertGregorianToJalali(row.date)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {row.invoice_count}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {formatPrice(row.total_sales)} تومان
                            </td>
                            <td className="px-6 py-4 text-sm text-green-600">
                              {formatPrice(row.total_paid)} تومان
                            </td>
                            <td className="px-6 py-4 text-sm text-red-600">
                              {formatPrice(row.total_remaining)} تومان
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {salesReport.data.length === 0 && (
                      <EmptyState title="داده‌ای یافت نشد" />
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Inventory Report */}
          {activeTab === 'inventory' && inventoryReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title="تعداد محصولات"
                  value={inventoryReport.total_products}
                  icon={<HiOutlineShoppingBag className="w-6 h-6" />}
                  color="blue"
                />
                <StatCard
                  title="ارزش کل موجودی"
                  value={`${formatPrice(inventoryReport.total_inventory_value)} تومان`}
                  icon={<HiOutlineCurrencyDollar className="w-6 h-6" />}
                  color="green"
                />
                <StatCard
                  title="موجودی کم"
                  value={inventoryReport.low_stock_count}
                  icon={<HiOutlineExclamation className="w-6 h-6" />}
                  color="red"
                  subtitle="نیاز به شارژ"
                />
              </div>

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                        کد
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                        نام محصول
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                        موجودی
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                        حداقل
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                        ارزش
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                        وضعیت
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inventoryReport.products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {product.code}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {product.stock_qty} {product.unit}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {product.min_stock}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatPrice(product.stock_value)} تومان
                        </td>
                        <td className="px-6 py-4">
                          {product.is_low_stock ? (
                            <Badge variant="danger">موجودی کم</Badge>
                          ) : (
                            <Badge variant="success">نرمال</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {inventoryReport.products.length === 0 && (
                  <EmptyState title="محصولی یافت نشد" />
                )}
              </div>
            </div>
          )}

          {/* Customer Balance */}
          {activeTab === 'customer-balance' && customerBalance && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                  title="تعداد مشتریان دارای مانده"
                  value={customerBalance.total_customers_with_balance}
                  icon={<HiOutlineUserGroup className="w-6 h-6" />}
                  color="blue"
                />
                <StatCard
                  title="جمع مطالبات"
                  value={`${formatPrice(customerBalance.total_receivable)} تومان`}
                  icon={<HiOutlineCurrencyDollar className="w-6 h-6" />}
                  color="red"
                />
              </div>

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                        نام
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                        نوع
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                        مانده
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                        سقف اعتبار
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                        مصرف اعتبار
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customerBalance.customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {customer.name}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              customer.type === 'legal' ? 'warning' : 'info'
                            }
                          >
                            {customer.type === 'legal' ? 'حقوقی' : 'حقیقی'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-red-600 font-medium">
                          {formatPrice(customer.balance)} تومان
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatPrice(customer.credit_limit)} تومان
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  customer.credit_usage_percent > 100
                                    ? 'bg-red-500'
                                    : customer.credit_usage_percent > 75
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                }`}
                                style={{
                                  width: `${Math.min(customer.credit_usage_percent, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">
                              {customer.credit_usage_percent.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {customerBalance.customers.length === 0 && (
                  <EmptyState title="مشتری با مانده یافت نشد" />
                )}
              </div>
            </div>
          )}

          {/* Supplier Balance */}
          {activeTab === 'supplier-balance' && supplierBalance && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                  title="تعداد تامین‌کنندگان دارای مانده"
                  value={supplierBalance.total_suppliers_with_balance}
                  icon={<HiOutlineUserGroup className="w-6 h-6" />}
                  color="blue"
                />
                <StatCard
                  title="جمع بدهی‌ها"
                  value={`${formatPrice(supplierBalance.total_payable)} تومان`}
                  icon={<HiOutlineCurrencyDollar className="w-6 h-6" />}
                  color="green"
                />
              </div>

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                        نام
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                        مانده
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {supplierBalance.suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {supplier.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-green-600 font-medium">
                          {formatPrice(supplier.balance)} تومان
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {supplierBalance.suppliers.length === 0 && (
                  <EmptyState title="تامین‌کننده با مانده یافت نشد" />
                )}
              </div>
            </div>
          )}

          {/* Profit/Loss */}
          {activeTab === 'profit-loss' && profitLoss && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="جمع فروش"
                  value={`${formatPrice(profitLoss.total_sales)} تومان`}
                  icon={<HiOutlineCurrencyDollar className="w-6 h-6" />}
                  color="green"
                />
                <StatCard
                  title="جمع خرید"
                  value={`${formatPrice(profitLoss.total_purchases)} تومان`}
                  icon={<HiOutlineCurrencyDollar className="w-6 h-6" />}
                  color="red"
                />
                <StatCard
                  title="سود ناخالص"
                  value={`${formatPrice(profitLoss.gross_profit)} تومان`}
                  icon={<HiOutlineCurrencyDollar className="w-6 h-6" />}
                  color={profitLoss.gross_profit >= 0 ? 'blue' : 'red'}
                />
                <StatCard
                  title="حاشیه سود"
                  value={`${profitLoss.profit_margin.toFixed(1)}%`}
                  icon={<HiOutlineChartBar className="w-6 h-6" />}
                  color="purple"
                />
              </div>

              <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  خلاصه سود و زیان
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                    <span className="font-medium text-gray-700">
                      درآمد (فروش)
                    </span>
                    <span className="font-bold text-green-600">
                      +{formatPrice(profitLoss.total_sales)} تومان
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl">
                    <span className="font-medium text-gray-700">
                      هزینه (خرید)
                    </span>
                    <span className="font-bold text-red-600">
                      -{formatPrice(profitLoss.total_purchases)} تومان
                    </span>
                  </div>
                  <div className="border-t-2 border-gray-300 my-4" />
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                    <span className="font-bold text-gray-800 text-lg">
                      سود ناخالص
                    </span>
                    <span
                      className={`font-bold text-lg ${
                        profitLoss.gross_profit >= 0
                          ? 'text-blue-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatPrice(profitLoss.gross_profit)} تومان
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
