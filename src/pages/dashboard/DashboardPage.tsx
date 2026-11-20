import { useQuery } from '@tanstack/react-query'
import {
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineExclamation,
  HiOutlineShoppingBag,
  HiOutlineTrendingDown,
  HiOutlineTrendingUp,
  HiOutlineUserGroup,
} from 'react-icons/hi'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import LoadingSpinner from '@/components/ui/LoadingSpinner'
import StatCard from '@/components/ui/StatCard'
import { invoiceService } from '@/services/invoiceService'
import { reportService } from '@/services/reportService'

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
]

export default function DashboardPage() {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fa-IR').format(Math.round(price))

  // گزارش فروش ۳۰ روز اخیر
  const { data: salesReport, isLoading: salesLoading } = useQuery({
    queryKey: ['dashboard', 'sales'],
    queryFn: () => reportService.getSalesReport({ group_by: 'day' }),
  })

  // گزارش سود و زیان
  const { data: profitLoss, isLoading: profitLoading } = useQuery({
    queryKey: ['dashboard', 'profit-loss'],
    queryFn: () => reportService.getProfitLossReport(),
  })

  // گزارش موجودی
  const { data: inventoryReport, isLoading: inventoryLoading } = useQuery({
    queryKey: ['dashboard', 'inventory'],
    queryFn: () => reportService.getInventoryReport(),
  })

  // مانده مشتریان
  const { data: customerBalance, isLoading: customerLoading } = useQuery({
    queryKey: ['dashboard', 'customer-balance'],
    queryFn: () => reportService.getCustomerBalanceReport(),
  })

  // فاکتورهای اخیر
  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['dashboard', 'recent-invoices'],
    queryFn: () => invoiceService.getInvoices({ limit: 5 }),
  })

  const isLoading =
    salesLoading ||
    profitLoading ||
    inventoryLoading ||
    customerLoading ||
    invoicesLoading

  // آماده‌سازی داده‌های نمودار فروش
  const salesChartData =
    salesReport?.data?.map((row) => ({
      name: row.date,
      فروش: row.total_sales,
      دریافتی: row.total_paid,
      مانده: row.total_remaining,
    })) || []

  // آماده‌سازی داده‌های نمودار دایره‌ای (نوع فاکتورها)
  const invoiceTypeData = [
    {
      name: 'فروش',
      value:
        recentInvoices?.invoices?.filter((i) => i.invoice_type === 'sale')
          .length || 0,
    },
    {
      name: 'خرید',
      value:
        recentInvoices?.invoices?.filter((i) => i.invoice_type === 'purchase')
          .length || 0,
    },
    {
      name: 'پیش‌فاکتور',
      value:
        recentInvoices?.invoices?.filter((i) => i.invoice_type === 'proforma')
          .length || 0,
    },
  ].filter((item) => item.value > 0)

  // آماده‌سازی داده‌های نمودار خطی (روند فروش)
  const trendData =
    salesReport?.data?.slice(-7).map((row) => ({
      date: row.date,
      amount: row.total_sales,
    })) || []

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">داشبورد</h1>
        <p className="text-gray-500 mt-1">نمای کلی از وضعیت کسب‌وکار</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="فروش امروز"
          value={`${formatPrice(salesReport?.data?.reduce((sum, d) => sum + d.total_sales, 0) || 0)} تومان`}
          icon={<HiOutlineCurrencyDollar className="w-6 h-6" />}
          color="green"
          subtitle="مجموع فاکتورهای فروش"
        />
        <StatCard
          title="تعداد فاکتورها"
          value={recentInvoices?.total || 0}
          icon={<HiOutlineDocumentText className="w-6 h-6" />}
          color="blue"
          subtitle="کل فاکتورهای ثبت شده"
        />
        <StatCard
          title="موجودی انبار"
          value={`${inventoryReport?.total_products || 0} محصول`}
          icon={<HiOutlineShoppingBag className="w-6 h-6" />}
          color="purple"
          subtitle={`${inventoryReport?.low_stock_count || 0} با موجودی کم`}
        />
        <StatCard
          title="مطالبات"
          value={`${formatPrice(customerBalance?.total_receivable || 0)} تومان`}
          icon={<HiOutlineUserGroup className="w-6 h-6" />}
          color="red"
          subtitle={`${customerBalance?.total_customers_with_balance || 0} مشتری دارای بدهی`}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">نمودار فروش</h3>
          {salesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) =>
                    formatPrice(Number(value ?? 0)) + ' تومان'
                  }
                />
                <Legend />
                <Bar dataKey="فروش" fill="#10b981" />
                <Bar dataKey="دریافتی" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              داده‌ای برای نمایش وجود ندارد
            </div>
          )}
        </div>

        {/* Invoice Type Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            توزیع نوع فاکتورها
          </h3>
          {invoiceTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={invoiceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {invoiceTypeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              داده‌ای برای نمایش وجود ندارد
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            روند فروش (۷ روز اخیر)
          </h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) =>
                    formatPrice(Number(value ?? 0)) + ' تومان'
                  }
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              داده‌ای برای نمایش وجود ندارد
            </div>
          )}
        </div>

        {/* Profit/Loss Summary */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            خلاصه سود و زیان
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <HiOutlineTrendingUp className="w-6 h-6 text-green-600" />
                <span className="font-medium text-gray-700">درآمد (فروش)</span>
              </div>
              <span className="font-bold text-green-600">
                +{formatPrice(profitLoss?.total_sales || 0)} تومان
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <HiOutlineTrendingDown className="w-6 h-6 text-red-600" />
                <span className="font-medium text-gray-700">هزینه (خرید)</span>
              </div>
              <span className="font-bold text-red-600">
                -{formatPrice(profitLoss?.total_purchases || 0)} تومان
              </span>
            </div>
            <div className="border-t-2 border-gray-300 my-4" />
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <HiOutlineCurrencyDollar className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-gray-800">سود ناخالص</span>
              </div>
              <span
                className={`font-bold text-lg ${
                  (profitLoss?.gross_profit || 0) >= 0
                    ? 'text-blue-600'
                    : 'text-red-600'
                }`}
              >
                {formatPrice(profitLoss?.gross_profit || 0)} تومان
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-3">
                <HiOutlineTrendingUp className="w-6 h-6 text-purple-600" />
                <span className="font-medium text-gray-700">حاشیه سود</span>
              </div>
              <span className="font-bold text-purple-600">
                {(profitLoss?.profit_margin || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-800 mb-4">فاکتورهای اخیر</h3>
        {recentInvoices?.invoices && recentInvoices.invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600">
                    شماره
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600">
                    نوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600">
                    مبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600">
                    وضعیت
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentInvoices.invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.invoice_type === 'sale'
                            ? 'bg-green-100 text-green-700'
                            : invoice.invoice_type === 'purchase'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {invoice.invoice_type === 'sale'
                          ? 'فروش'
                          : invoice.invoice_type === 'purchase'
                            ? 'خرید'
                            : 'پیش‌فاکتور'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatPrice(invoice.total_amount)} تومان
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : invoice.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-700'
                              : invoice.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {invoice.status === 'paid'
                          ? 'پرداخت شده'
                          : invoice.status === 'confirmed'
                            ? 'تایید شده'
                            : invoice.status === 'cancelled'
                              ? 'لغو شده'
                              : 'پیش‌نویس'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            فاکتوری ثبت نشده است
          </div>
        )}
      </div>

      {/* Low Stock Alert */}
      {inventoryReport && inventoryReport.low_stock_count > 0 && (
        <div className="card bg-yellow-50 border border-yellow-200">
          <div className="flex items-center gap-3">
            <HiOutlineExclamation className="w-6 h-6 text-yellow-600" />
            <div>
              <h4 className="font-bold text-yellow-800">هشدار موجودی کم</h4>
              <p className="text-sm text-yellow-700">
                {inventoryReport.low_stock_count} محصول دارای موجودی کم است و
                نیاز به شارژ دارد
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
