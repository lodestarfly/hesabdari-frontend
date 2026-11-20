import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  HiOutlineArrowRight,
  HiOutlineCalendar,
  HiOutlineCheck,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlinePhone,
  HiOutlinePrinter,
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiOutlineX,
} from 'react-icons/hi'
import { useNavigate, useParams } from 'react-router-dom'

import { customerService } from '@/services/customerService'
import { invoiceService } from '@/services/invoiceService'
import { paymentService } from '@/services/paymentService'
import { productService } from '@/services/productService'
import { supplierService } from '@/services/supplierService'
import { useSettingsStore } from '@/store/settingsStore'
import { formatQty, printInvoice } from '@/utils/printInvoice'

import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { PaymentInfo } from '@/utils/printInvoice'
import PaymentModal from './PaymentModal'

const methodLabels: Record<string, string> = {
  cash: 'نقدی',
  card: 'کارت',
  check: 'چک',
  bank_transfer: 'انتقال بانکی',
  online: 'آنلاین',
}

const typeLabels: Record<string, string> = {
  sale: 'فروش',
  purchase: 'خرید',
  proforma: 'پیش‌فاکتور',
}

const statusLabels: Record<string, string> = {
  draft: 'پیش‌نویس',
  confirmed: 'تایید شده',
  paid: 'پرداخت شده',
  cancelled: 'لغو شده',
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const settings = useSettingsStore()

  const [isConvertOpen, setIsConvertOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // ---------- فاکتور ----------
  const {
    data: invoice,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getInvoiceById(Number(id)),
    enabled: !!id,
  })

  const { data: payments } = useQuery({
    queryKey: ['invoice-payments', invoice?.id],
    queryFn: () => paymentService.getInvoicePayments(invoice!.id),
    enabled: !!invoice?.id,
  })

  // ---------- اطلاعات کامل مشتری ----------
  const { data: customer } = useQuery({
    queryKey: ['customer', invoice?.customer_id],
    queryFn: () => customerService.getCustomerById(invoice!.customer_id!),
    enabled: !!invoice?.customer_id,
  })

  // ---------- اطلاعات کامل تامین‌کننده ----------
  const { data: supplier } = useQuery({
    queryKey: ['supplier', invoice?.supplier_id],
    queryFn: () => supplierService.getSupplierById(invoice!.supplier_id!),
    enabled: !!invoice?.supplier_id,
  })

  // ---------- واحد کالاها ----------
  const { data: unitsMap } = useQuery({
    queryKey: ['invoice-units', invoice?.id],
    queryFn: async () => {
      const ids = Array.from(
        new Set((invoice?.items || []).map((i) => i.product_id))
      )
      const list = await Promise.all(
        ids.map((pid) => productService.getProductById(pid).catch(() => null))
      )
      const map: Record<number, string> = {}
      list.forEach((p: any) => {
        if (p) map[p.id] = p.unit || ''
      })
      return map
    },
    enabled: !!invoice && (invoice.items?.length || 0) > 0,
  })

  // ---------- Mutationها ----------
  const convertMutation = useMutation({
    mutationFn: () => invoiceService.convertProformaToInvoice(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('پیش‌فاکتور با موفقیت به فاکتور فروش تبدیل شد')
      setIsConvertOpen(false)
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || 'خطا در تبدیل پیش‌فاکتور'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => invoiceService.cancelInvoice(Number(id), cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('فاکتور با موفقیت لغو شد')
      setIsCancelOpen(false)
      setCancelReason('')
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || 'خطا در لغو فاکتور'),
  })

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fa-IR').format(Math.round(price))

  const formatDate = (date?: string | null) =>
    date ? new Date(date).toLocaleDateString('fa-IR') : '-'

  if (isLoading) return <LoadingSpinner />

  if (isError || !invoice) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <h2 className="text-red-800 font-bold mb-2">خطا در بارگذاری فاکتور</h2>
        <p className="text-red-600 text-sm mb-4">
          فاکتور مورد نظر یافت نشد یا دسترسی ندارید
        </p>
        <button onClick={() => navigate('/invoices')} className="btn-primary">
          بازگشت به لیست فاکتورها
        </button>
      </div>
    )
  }

  const isPurchase = invoice.invoice_type === 'purchase'
  const party: any = isPurchase ? supplier : customer
  const partyLabel = isPurchase ? 'تامین‌کننده' : 'مشتری'
  const canConvert =
    invoice.invoice_type === 'proforma' && invoice.status === 'draft'
  const canCancel = invoice.status === 'confirmed'
  const canPay = invoice.status === 'confirmed' && invoice.remaining_amount > 0

  // ---------- چاپ ----------
  const handlePrint = async () => {
    if (!invoice) return

    try {
      // دریافت پرداخت‌های فاکتور
      let payments: PaymentInfo[] = []
      try {
        const paymentsData = await paymentService.getInvoicePayments(invoice.id)
        payments = (paymentsData || []).map((p: any) => ({
          id: p.id,
          amount: Number(p.amount),
          payment_method: p.payment_method,
          payment_type: p.payment_type,
          reference_number: p.reference_number,
          created_at: p.created_at,
        }))
      } catch (err) {
        console.error('خطا در دریافت پرداخت‌ها:', err)
      }

      printInvoice(invoice, {
        party: party || null,
        partyLabel,
        units: unitsMap || {},
        companyName: settings.companyName,
        companyLogo: settings.logo,
        companyPhone: settings.phone,
        companyEmail: settings.email,
        companyAddress: settings.address,
        payments, // ✅ ارسال پرداخت‌ها به تابع چاپ
      })
    } catch {
      toast.error('خطا در آماده‌سازی چاپ فاکتور')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="بازگشت"
          >
            <HiOutlineArrowRight className="w-5 h-5" />
          </button>
          {settings.logo && (
            <img
              src={settings.logo}
              alt="لوگو"
              className="w-12 h-12 rounded-xl object-cover border border-gray-200 bg-white"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              فاکتور {invoice.invoice_number}
            </h1>
            <p className="text-gray-500 mt-1">جزئیات کامل فاکتور</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <HiOutlinePrinter className="w-5 h-5" />
            چاپ / PDF
          </button>
          {canConvert && (
            <button
              onClick={() => setIsConvertOpen(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <HiOutlineCheck className="w-5 h-5" />
              تبدیل به فاکتور
            </button>
          )}
          {canPay && (
            <button
              onClick={() => setIsPaymentOpen(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              <HiOutlineCurrencyDollar className="w-5 h-5" />
              ثبت پرداخت
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setIsCancelOpen(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <HiOutlineX className="w-5 h-5" />
              لغو فاکتور
            </button>
          )}
        </div>
      </div>

      {/* کارت‌های اطلاعات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <HiOutlineDocumentText className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">شماره فاکتور</span>
          </div>
          <p className="text-lg font-bold text-gray-800">
            {invoice.invoice_number}
          </p>
          {invoice.is_official && (
            <Badge variant="info" size="sm">
              رسمی
            </Badge>
          )}
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <HiOutlineShoppingBag className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">نوع فاکتور</span>
          </div>
          <Badge
            variant={
              invoice.invoice_type === 'sale'
                ? 'success'
                : invoice.invoice_type === 'purchase'
                  ? 'info'
                  : 'warning'
            }
          >
            {typeLabels[invoice.invoice_type]}
          </Badge>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <HiOutlineCheck className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">وضعیت</span>
          </div>
          <Badge
            variant={
              invoice.status === 'paid'
                ? 'success'
                : invoice.status === 'confirmed'
                  ? 'info'
                  : invoice.status === 'cancelled'
                    ? 'danger'
                    : 'neutral'
            }
          >
            {statusLabels[invoice.status]}
          </Badge>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <HiOutlineCalendar className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600">تاریخ صدور</span>
          </div>
          <p className="text-lg font-bold text-gray-800">
            {formatDate(invoice.issue_date)}
          </p>
        </div>
      </div>

      {/* ✅ اطلاعات کامل طرف حساب */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <HiOutlineUser className="w-5 h-5 text-blue-600" />
          اطلاعات {partyLabel}
        </h3>
        {party ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">نام / شرکت</p>
              <p className="font-bold text-gray-800">{party.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">کد ملی / شناسه ملی</p>
              <p className="font-medium text-gray-800">
                {party.national_code || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">شخص تماس</p>
              <p className="font-medium text-gray-800">
                {party.contact_person || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <HiOutlinePhone className="w-4 h-4" /> تلفن / موبایل
              </p>
              <p className="font-medium text-gray-800">
                {[party.phone, party.mobile].filter(Boolean).join(' | ') || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">ایمیل</p>
              <p className="font-medium text-gray-800">{party.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">آدرس</p>
              <p className="font-medium text-gray-800">
                {party.address || '-'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            اطلاعات {partyLabel} ثبت نشده است
          </p>
        )}
      </div>

      {/* جدول آیتم‌ها + واحد */}
      <div className="card overflow-hidden">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          آیتم‌های فاکتور
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                  ردیف
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                  شرح
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                  تعداد
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                  واحد
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                  قیمت واحد
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                  تخفیف
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                  جمع کل
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.items?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {item.row_number}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-800">
                      {item.description || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatQty(item.quantity)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {unitsMap?.[item.product_id] || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatPrice(item.unit_price)} تومان
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    {item.discount_amount > 0
                      ? `${formatPrice(item.discount_amount)} تومان`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-800">
                    {formatPrice(item.total_price)} تومان
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {payments && payments.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <HiOutlineCurrencyDollar className="w-5 h-5 text-green-600" />
            تاریخچه پرداخت‌ها
          </h3>
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <HiOutlineCurrencyDollar
                    className={`w-5 h-5 ${p.payment_type === 'receipt' ? 'text-green-600' : 'text-red-600'}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {methodLabels[p.payment_method] || p.payment_method}
                      {p.reference_number && (
                        <span className="text-xs text-gray-500 mr-2">
                          ({p.reference_number})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString('fa-IR')
                        : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-bold ${p.payment_type === 'receipt' ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatPrice(p.amount)} تومان
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* خلاصه مالی */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-800 mb-4">خلاصه مالی</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
            <span className="text-gray-700">جمع کل:</span>
            <span className="font-bold text-gray-800">
              {formatPrice(invoice.subtotal)} تومان
            </span>
          </div>
          <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl">
            <span className="text-gray-700">تخفیف:</span>
            <span className="font-bold text-red-600">
              -{formatPrice(invoice.discount_amount)} تومان
            </span>
          </div>
          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
            <span className="text-gray-700">
              مالیات ({invoice.tax_percent}%):
            </span>
            <span className="font-bold text-blue-600">
              {formatPrice(invoice.tax_amount)} تومان
            </span>
          </div>
          <div className="border-t-2 border-gray-300 my-4" />
          <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
            <span className="text-lg font-bold text-gray-800">مبلغ نهایی:</span>
            <span className="text-2xl font-bold text-green-600">
              {formatPrice(invoice.total_amount)} تومان
            </span>
          </div>
          <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
            <span className="text-gray-700">پرداخت شده:</span>
            <span className="font-bold text-purple-600">
              {formatPrice(invoice.paid_amount)} تومان
            </span>
          </div>
          <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl">
            <span className="text-gray-700">مانده:</span>
            <span
              className={`font-bold text-lg ${invoice.remaining_amount > 0 ? 'text-orange-600' : 'text-green-600'}`}
            >
              {formatPrice(invoice.remaining_amount)} تومان
            </span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">یادداشت‌ها</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Dialog تبدیل */}
      {isConvertOpen && (
        <ConfirmDialog
          isOpen={isConvertOpen}
          onClose={() => setIsConvertOpen(false)}
          onConfirm={() => convertMutation.mutate()}
          title="تبدیل پیش‌فاکتور"
          message="آیا از تبدیل این پیش‌فاکتور به فاکتور فروش اطمینان دارید؟ موجودی انبار به‌روزرسانی خواهد شد."
          confirmText="تبدیل"
          cancelText="انصراف"
          variant="info"
          isLoading={convertMutation.isPending}
        />
      )}

      {/* Dialog لغو */}
      {isCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">لغو فاکتور</h3>
            <p className="text-sm text-gray-600 mb-4">
              آیا از لغو این فاکتور اطمینان دارید؟ موجودی انبار بازگردانی خواهد
              شد.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="input-field resize-none mb-4"
              placeholder="دلیل لغو فاکتور را وارد کنید (حداقل 5 کاراکتر)..."
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsCancelOpen(false)
                  setCancelReason('')
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  if (cancelReason.trim().length < 5) {
                    toast.error('دلیل لغو باید حداقل 5 کاراکتر باشد')
                    return
                  }
                  cancelMutation.mutate()
                }}
                disabled={cancelMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'در حال لغو...' : 'لغو فاکتور'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal پرداخت */}
      {isPaymentOpen && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          invoice={invoice}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['invoice', id] })
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
            setIsPaymentOpen(false)
          }}
        />
      )}
    </div>
  )
}
