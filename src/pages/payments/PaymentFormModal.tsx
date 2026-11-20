import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { HiOutlineSave } from 'react-icons/hi'
import { z } from 'zod'

import { invoiceService } from '@/services/invoiceService'
import { paymentService } from '@/services/paymentService'

import Modal from '@/components/ui/Modal'

const schema = z.object({
  invoice_id: z.number().min(1, 'فاکتور را انتخاب کنید'),
  amount: z.number().min(0.01, 'مبلغ باید بیشتر از صفر باشد'),
  payment_method: z.string().min(1, 'روش پرداخت را انتخاب کنید'),
  payment_type: z.enum(['receipt', 'payment']),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface PaymentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PaymentFormModal({
  isOpen,
  onClose,
  onSuccess,
}: PaymentFormModalProps) {
  const queryClient = useQueryClient()
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoice_id: 0,
      amount: 0,
      payment_method: 'cash',
      payment_type: 'receipt',
      reference_number: '',
      notes: '',
    },
  })

  const { data: invoices } = useQuery({
    queryKey: ['invoices', 'for-payment'],
    queryFn: () => invoiceService.getInvoices({ limit: 100 }),
    enabled: isOpen,
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => paymentService.createPayment(data),
    onSuccess: () => {
      toast.success('پرداخت با موفقیت ثبت شد')
      onSuccess()
      form.reset()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'خطا در ثبت پرداخت')
    },
  })

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data)
  }

  const selectedInvoice = invoices?.invoices?.find(
    (inv) => inv.id === form.watch('invoice_id')
  )
  const remainingAmount = selectedInvoice?.remaining_amount || 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ثبت پرداخت جدید" size="md">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            فاکتور *
          </label>
          <select
            {...form.register('invoice_id', { valueAsNumber: true })}
            className="input-field"
            onChange={(e) => {
              const inv = invoices?.invoices?.find(
                (i) => i.id === Number(e.target.value)
              )
              if (inv) {
                form.setValue(
                  'payment_type',
                  inv.invoice_type === 'purchase' ? 'payment' : 'receipt'
                )
                form.setValue('amount', Number(inv.remaining_amount))
              }
            }}
          >
            <option value="">انتخاب فاکتور...</option>
            {invoices?.invoices?.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoice_number} -{' '}
                {inv.invoice_type === 'sale'
                  ? 'فروش'
                  : inv.invoice_type === 'purchase'
                    ? 'خرید'
                    : 'پیش‌فاکتور'}{' '}
                (مانده: {inv.remaining_amount.toLocaleString('fa-IR')})
              </option>
            ))}
          </select>
          {form.formState.errors.invoice_id && (
            <p className="mt-1 text-sm text-red-500">
              {form.formState.errors.invoice_id.message}
            </p>
          )}
        </div>

        {selectedInvoice && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">مبلغ کل:</span>
              <span className="font-bold">
                {selectedInvoice.total_amount.toLocaleString('fa-IR')} تومان
              </span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">پرداخت شده:</span>
              <span className="font-bold text-green-600">
                {selectedInvoice.paid_amount.toLocaleString('fa-IR')} تومان
              </span>
            </div>
            <div className="flex justify-between border-t border-blue-200 pt-1">
              <span className="text-gray-600">مانده:</span>
              <span className="font-bold text-red-600">
                {remainingAmount.toLocaleString('fa-IR')} تومان
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            مبلغ پرداخت *
          </label>
          <input
            type="number"
            {...form.register('amount', { valueAsNumber: true })}
            className="input-field"
            placeholder="مبلغ به تومان"
          />
          {form.formState.errors.amount && (
            <p className="mt-1 text-sm text-red-500">
              {form.formState.errors.amount.message}
            </p>
          )}
          {remainingAmount > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              حداکثر: {remainingAmount.toLocaleString('fa-IR')} تومان
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع *
            </label>
            <select {...form.register('payment_type')} className="input-field">
              <option value="receipt">دریافت</option>
              <option value="payment">پرداخت</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              روش پرداخت *
            </label>
            <select
              {...form.register('payment_method')}
              className="input-field"
            >
              <option value="cash">نقدی</option>
              <option value="card">کارت</option>
              <option value="check">چک</option>
              <option value="bank_transfer">انتقال بانکی</option>
              <option value="online">آنلاین</option>
            </select>
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
            rows={3}
            className="input-field resize-none"
            placeholder="توضیحات اضافی..."
          />
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 btn-primary py-3 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <HiOutlineSave className="w-5 h-5" />
            {createMutation.isPending ? 'در حال ثبت...' : 'ثبت پرداخت'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
