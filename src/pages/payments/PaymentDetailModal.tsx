import { HiOutlinePrinter } from 'react-icons/hi'

import Modal from '@/components/ui/Modal'
import { Payment } from '@/services/paymentService'

const methodLabels: Record<string, string> = {
  cash: 'نقدی',
  card: 'کارت',
  check: 'چک',
  bank_transfer: 'انتقال بانکی',
  online: 'آنلاین',
}

const typeLabels: Record<string, string> = {
  receipt: 'دریافت',
  payment: 'پرداخت',
}

interface PaymentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  payment: Payment
}

export default function PaymentDetailModal({
  isOpen,
  onClose,
  payment,
}: PaymentDetailModalProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fa-IR').format(Math.round(price))

  const formatDate = (date: string) => new Date(date).toLocaleString('fa-IR')

  const handlePrint = () => {
    const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<title>رسید پرداخت</title>
<style>
  body { font-family: Tahoma, Arial, sans-serif; color: #111; margin: 24px; }
  .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
  .header h1 { color: #2563eb; margin: 0; font-size: 22px; }
  .header p { color: #666; font-size: 12px; margin: 4px 0 0; }
  .info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
  .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #ddd; }
  .info-row:last-child { border-bottom: none; }
  .label { color: #6b7280; font-weight: bold; }
  .value { color: #111827; font-weight: bold; }
  .amount-box { background: ${payment.payment_type === 'receipt' ? '#dcfce7' : '#fee2e2'}; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
  .amount-box .label { font-size: 14px; color: #374151; }
  .amount-box .value { font-size: 28px; font-weight: bold; color: ${payment.payment_type === 'receipt' ? '#16a34a' : '#dc2626'}; margin-top: 8px; }
  .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
</style>
</head>
<body>
  <div class="header">
    <h1>رسید ${typeLabels[payment.payment_type]}</h1>
    <p>سیستم حسابداری حرفه‌ای</p>
  </div>

  <div class="info">
    <div class="info-row"><span class="label">شماره فاکتور:</span><span class="value">${payment.invoice_number || 'فاکتور #' + payment.invoice_id}</span></div>
    <div class="info-row"><span class="label">نوع:</span><span class="value">${typeLabels[payment.payment_type]}</span></div>
    <div class="info-row"><span class="label">روش پرداخت:</span><span class="value">${methodLabels[payment.payment_method] || payment.payment_method}</span></div>
    ${payment.reference_number ? `<div class="info-row"><span class="label">شماره مرجع:</span><span class="value">${payment.reference_number}</span></div>` : ''}
    <div class="info-row"><span class="label">تاریخ:</span><span class="value">${payment.created_at ? formatDate(payment.created_at) : '-'}</span></div>
  </div>

  <div class="amount-box">
    <div class="label">مبلغ ${typeLabels[payment.payment_type]}</div>
    <div class="value">${formatPrice(payment.amount)} تومان</div>
  </div>

  ${payment.notes ? `<div class="info"><div class="info-row"><span class="label">یادداشت:</span><span class="value">${payment.notes}</span></div></div>` : ''}

  <div class="footer">این رسید توسط سیستم حسابداری تولید شده است</div>

  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`

    const win = window.open('', '_blank', 'width=700,height=600')
    if (win) {
      win.document.open()
      win.document.write(html)
      win.document.close()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="جزئیات پرداخت" size="md">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">شماره فاکتور:</span>
            <span className="font-bold text-gray-800">
              {payment.invoice_number || `فاکتور #${payment.invoice_id}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">نوع:</span>
            <span
              className={`font-bold ${payment.payment_type === 'receipt' ? 'text-green-600' : 'text-red-600'}`}
            >
              {typeLabels[payment.payment_type]}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">روش پرداخت:</span>
            <span className="font-medium text-gray-800">
              {methodLabels[payment.payment_method] || payment.payment_method}
            </span>
          </div>
          {payment.reference_number && (
            <div className="flex justify-between">
              <span className="text-gray-600">شماره مرجع:</span>
              <span className="font-medium text-gray-800">
                {payment.reference_number}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">تاریخ:</span>
            <span className="font-medium text-gray-800">
              {payment.created_at ? formatDate(payment.created_at) : '-'}
            </span>
          </div>
        </div>

        <div
          className={`rounded-xl p-6 text-center ${payment.payment_type === 'receipt' ? 'bg-green-50' : 'bg-red-50'}`}
        >
          <p className="text-sm text-gray-600 mb-2">
            مبلغ {typeLabels[payment.payment_type]}
          </p>
          <p
            className={`text-3xl font-bold ${payment.payment_type === 'receipt' ? 'text-green-600' : 'text-red-600'}`}
          >
            {formatPrice(payment.amount)} تومان
          </p>
        </div>

        {payment.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm font-bold text-yellow-800 mb-1">یادداشت:</p>
            <p className="text-sm text-yellow-700">{payment.notes}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium"
          >
            بستن
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
          >
            <HiOutlinePrinter className="w-5 h-5" />
            چاپ رسید
          </button>
        </div>
      </div>
    </Modal>
  )
}
