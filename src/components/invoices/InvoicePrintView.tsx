import { Invoice } from '@/types/invoice'

interface InvoicePrintViewProps {
  invoice: Invoice
}

export default function InvoicePrintView({ invoice }: InvoicePrintViewProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fa-IR').format(Math.round(price))

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fa-IR')

  const typeLabels = {
    sale: 'فروش',
    purchase: 'خرید',
    proforma: 'پیش‌فاکتور',
  }

  const statusLabels = {
    draft: 'پیش‌نویس',
    confirmed: 'تایید شده',
    paid: 'پرداخت شده',
    cancelled: 'لغو شده',
  }

  return (
    <div className="print-area" dir="rtl">
      {/* هدر */}
      <div
        style={{
          textAlign: 'center',
          borderBottom: '3px solid #2563eb',
          paddingBottom: '15px',
          marginBottom: '20px',
        }}
      >
        <h1 style={{ color: '#2563eb', margin: 0, fontSize: '24px' }}>
          فاکتور {invoice.invoice_number}
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px' }}>
          سیستم حسابداری حرفه‌ای
        </p>
      </div>

      {/* اطلاعات فاکتور */}
      <div
        style={{
          background: '#f3f4f6',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>
                نوع فاکتور:
              </td>
              <td style={{ padding: '5px' }}>
                {typeLabels[invoice.invoice_type]}
              </td>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>وضعیت:</td>
              <td style={{ padding: '5px' }}>{statusLabels[invoice.status]}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>
                تاریخ صدور:
              </td>
              <td style={{ padding: '5px' }}>
                {formatDate(invoice.issue_date)}
              </td>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>
                تاریخ سررسید:
              </td>
              <td style={{ padding: '5px' }}>
                {invoice.due_date ? formatDate(invoice.due_date) : '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* جدول آیتم‌ها */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '20px',
        }}
      >
        <thead>
          <tr style={{ background: '#2563eb', color: 'white' }}>
            <th style={{ padding: '10px', border: '1px solid #1d4ed8' }}>
              ردیف
            </th>
            <th style={{ padding: '10px', border: '1px solid #1d4ed8' }}>
              شرح
            </th>
            <th style={{ padding: '10px', border: '1px solid #1d4ed8' }}>
              تعداد
            </th>
            <th style={{ padding: '10px', border: '1px solid #1d4ed8' }}>
              قیمت واحد
            </th>
            <th style={{ padding: '10px', border: '1px solid #1d4ed8' }}>
              تخفیف
            </th>
            <th style={{ padding: '10px', border: '1px solid #1d4ed8' }}>
              جمع کل
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id}>
              <td
                style={{
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  textAlign: 'center',
                }}
              >
                {item.row_number}
              </td>
              <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                {item.description}
              </td>
              <td
                style={{
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  textAlign: 'center',
                }}
              >
                {item.quantity}
              </td>
              <td
                style={{
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  textAlign: 'left',
                }}
              >
                {formatPrice(item.unit_price)}
              </td>
              <td
                style={{
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  textAlign: 'left',
                }}
              >
                {formatPrice(item.discount_amount)}
              </td>
              <td
                style={{
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  textAlign: 'left',
                }}
              >
                {formatPrice(item.total_price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* خلاصه مالی */}
      <div style={{ borderTop: '2px solid #2563eb', paddingTop: '15px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
          }}
        >
          <span>جمع کل:</span>
          <span>{formatPrice(invoice.subtotal)} تومان</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
          }}
        >
          <span>تخفیف:</span>
          <span>{formatPrice(invoice.discount_amount)} تومان</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
          }}
        >
          <span>مالیات ({invoice.tax_percent}%):</span>
          <span>{formatPrice(invoice.tax_amount)} تومان</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px',
            background: '#2563eb',
            color: 'white',
            borderRadius: '8px',
            marginTop: '10px',
            fontWeight: 'bold',
          }}
        >
          <span>مبلغ نهایی:</span>
          <span>{formatPrice(invoice.total_amount)} تومان</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
          }}
        >
          <span>پرداخت شده:</span>
          <span>{formatPrice(invoice.paid_amount)} تومان</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
          }}
        >
          <span>مانده:</span>
          <span>{formatPrice(invoice.remaining_amount)} تومان</span>
        </div>
      </div>

      {/* یادداشت */}
      {invoice.notes && (
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
          }}
        >
          <strong>یادداشت:</strong> {invoice.notes}
        </div>
      )}

      {/* فوتر */}
      <div
        style={{
          marginTop: '40px',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '10px',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '10px',
        }}
      >
        این سند توسط سیستم حسابداری حرفه‌ای تولید شده است
      </div>
    </div>
  )
}
