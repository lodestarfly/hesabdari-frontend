import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { HiOutlineCurrencyDollar } from 'react-icons/hi'
import { z } from 'zod'

import Modal from '@/components/ui/Modal'
import { invoiceService } from '@/services/invoiceService'
import { Invoice, paymentMethodLabels } from '@/types/invoice'

const paymentSchema = z.object({
  amount: z.number().min(1, 'مبلغ باید بیشتر از صفر باشد'),
  payment_method: z.enum(['cash', 'card', 'check', 'transfer']),
  reference_number: z.string().optional(),
  payment_type: z.enum(['receipt', 'payment']),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof paymentSchema>

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice
  onSuccess: () => void
}

/** تبدیل خطای API به رشته قابل نمایش */
function getPaymentErrorMessage(error: any): string {
  if (!error?.response?.data) return 'خطا در ثبت پرداخت'

  const detail = error.response.data.detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    return detail
      .map((e: any) => {
        const field = e.loc?.slice(1).join('.') || ''
        const msg = e.msg || ''
        return field ? `${field}: ${msg}` : msg
      })
      .join(' | ')
  }

  if (detail && typeof detail === 'object') {
    return JSON.stringify(detail)
  }

  return 'خطا در ثبت پرداخت'
}

export default function PaymentModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const paymentType =
    invoice.invoice_type === 'purchase' ? 'payment' : 'receipt'

  const form = useForm<FormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: invoice.remaining_amount,
      payment_method: 'cash',
      payment_type: paymentType,
      reference_number: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (invoice && isOpen) {
      form.reset({
        amount: invoice.remaining_amount,
        payment_method: 'cash',
        payment_type: paymentType,
        reference_number: '',
        notes: '',
      })
    }
  }, [invoice, isOpen, form])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price)
  }

  const onSubmit = async (data: FormData) => {
    // ✅ بررسی مبلغ
    if (data.amount > invoice.remaining_amount) {
      toast.error(
        `مبلغ پرداخت (${formatPrice(data.amount)}) بیشتر از مانده (${formatPrice(invoice.remaining_amount)}) است`
      )
      return
    }

    if (data.amount <= 0) {
      toast.error('مبلغ پرداخت باید بیشتر از صفر باشد')
      return
    }

    setIsLoading(true)
    try {
      // ✅ فقط data ارسال می‌شود - invoice_id در service اضافه می‌شود
      await invoiceService.addPayment(invoice.id, data)
      toast.success('پرداخت با موفقیت ثبت شد')
      onSuccess()
    } catch (error: any) {
      console.error('Payment error:', error)
      console.error('Response data:', error.response?.data)

      // ✅ استخراج پیام خطا به صورت رشته
      const message = getPaymentErrorMessage(error)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ثبت پرداخت" size="md">
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">شماره فاکتور:</span>
          <span className="font-bold text-gray-800">
            {invoice.invoice_number}
          </span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">مبلغ کل:</span>
          <span className="font-medium text-gray-800">
            {formatPrice(invoice.total_amount)} تومان
          </span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">پرداخت شده:</span>
          <span className="font-medium text-green-600">
            {formatPrice(invoice.paid_amount)} تومان
          </span>
        </div>
        <div className="border-t border-blue-200 pt-2 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-700">مانده:</span>
          <span className="font-bold text-lg text-red-600">
            {formatPrice(invoice.remaining_amount)} تومان
          </span>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            مبلغ پرداخت *
          </label>
          <div className="relative">
            <HiOutlineCurrencyDollar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              {...form.register('amount', { valueAsNumber: true })}
              className="input-field pr-10 text-lg font-bold"
              max={invoice.remaining_amount}
              step="1"
            />
          </div>
          {form.formState.errors.amount && (
            <p className="mt-1 text-sm text-red-500">
              {form.formState.errors.amount.message}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            حداکثر: {formatPrice(invoice.remaining_amount)} تومان
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              روش پرداخت *
            </label>
            <select
              {...form.register('payment_method')}
              className="input-field"
            >
              {Object.entries(paymentMethodLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع *
            </label>
            {/* ✅ فیلد مخفی برای ارسال payment_type */}
            <input type="hidden" {...form.register('payment_type')} />
            <select
              value={paymentType}
              disabled
              className="input-field bg-gray-100 cursor-not-allowed"
            >
              <option value="receipt">دریافت (فروش)</option>
              <option value="payment">پرداخت (خرید)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              نوع پرداخت بر اساس نوع فاکتور تعیین می‌شود
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            شماره مرجع / پیگیری
          </label>
          <input
            {...form.register('reference_number')}
            className="input-field"
            placeholder="شماره چک، رسید بانکی، ..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            یادداشت
          </label>
          <textarea
            {...form.register('notes')}
            rows={2}
            className="input-field resize-none"
            placeholder="توضیحات اضافی (اختیاری)"
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 shadow-lg"
          >
            {isLoading ? 'در حال ثبت...' : 'ثبت پرداخت'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
