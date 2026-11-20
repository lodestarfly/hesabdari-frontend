import { Invoice } from '@/types/invoice'

export interface PartyInfo {
  name?: string
  national_code?: string
  phone?: string
  mobile?: string
  email?: string
  address?: string
  contact_person?: string
}

export interface PaymentInfo {
  id: number
  amount: number
  payment_method: string
  payment_type: 'receipt' | 'payment'
  reference_number?: string
  created_at?: string
}

export interface PrintOptions {
  party?: PartyInfo | null
  partyLabel?: string
  units?: Record<number, string>
  companyName?: string
  companyLogo?: string | null
  companyPhone?: string
  companyEmail?: string
  companyAddress?: string
  payments?: PaymentInfo[] // ✅ اضافه شد
}

const typeLabels: Record<string, string> = {
  sale: 'فاکتور فروش',
  purchase: 'فاکتور خرید',
  proforma: 'پیش‌فاکتور',
}

const statusLabels: Record<string, string> = {
  draft: 'پیش‌نویس',
  confirmed: 'تایید شده',
  paid: 'پرداخت شده',
  cancelled: 'لغو شده',
}

// ✅ برچسب‌های فارسی روش پرداخت
const methodLabels: Record<string, string> = {
  cash: 'نقدی',
  card: 'کارت',
  check: 'چک',
  bank_transfer: 'انتقال بانکی',
  online: 'آنلاین',
}

// ✅ برچسب‌های فارسی نوع پرداخت
const paymentTypeLabels: Record<string, string> = {
  receipt: 'دریافت',
  payment: 'پرداخت',
}

const faPrice = (n: number) =>
  new Intl.NumberFormat('fa-IR').format(Math.round(n || 0))

export const formatQty = (q: number) => {
  const n = Number(q)
  if (!isFinite(n)) return '۰'
  return Number.isInteger(n)
    ? n.toLocaleString('fa-IR')
    : n.toLocaleString('fa-IR', { maximumFractionDigits: 3 })
}

const faDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('fa-IR') : '-'

const esc = (s: any) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const kvRow = (label: string, value: string) =>
  `<tr><td class="k">${label}</td><td class="v">${value || '-'}</td></tr>`

export function printInvoice(
  invoice: Invoice,
  opts: PrintOptions = {}
): boolean {
  const {
    party = null,
    partyLabel = 'مشتری',
    units = {},
    companyName = 'سیستم حسابداری حرفه‌ای',
    companyLogo = null,
    companyPhone = '',
    companyEmail = '',
    companyAddress = '',
    payments = [], // ✅ اضافه شد
  } = opts

  // ---------- ردیف‌های اقلام ----------
  const itemsRows = (invoice.items || [])
    .map((item) => {
      const unit = units[item.product_id] || ''
      return `
      <tr>
        <td class="c">${item.row_number}</td>
        <td>${esc(item.description || '-')}</td>
        <td class="c">${formatQty(item.quantity)}</td>
        <td class="c">${esc(unit)}</td>
        <td class="l">${faPrice(item.unit_price)}</td>
        <td class="l">${faPrice(item.discount_amount)}</td>
        <td class="l bold">${faPrice(item.total_price)}</td>
      </tr>`
    })
    .join('')

  // ---------- ردیف‌های پرداخت‌ها ----------
  let paymentsSection = ''
  if (payments && payments.length > 0) {
    const paymentsRows = payments
      .map((p) => {
        const date = p.created_at
          ? new Date(p.created_at).toLocaleDateString('fa-IR')
          : '-'
        const methodFa = methodLabels[p.payment_method] || p.payment_method
        const typeFa = paymentTypeLabels[p.payment_type] || p.payment_type
        return `
        <tr>
          <td class="c">${date}</td>
          <td class="c">${methodFa}</td>
          <td class="c">${typeFa}</td>
          <td class="c">${p.reference_number || '-'}</td>
          <td class="l bold">${faPrice(p.amount)}</td>
        </tr>`
      })
      .join('')

    paymentsSection = `
      <div class="section-title">تاریخچه پرداخت‌ها</div>
      <table class="items">
        <thead>
          <tr>
            <th style="width:15%">تاریخ</th>
            <th style="width:20%">روش پرداخت</th>
            <th style="width:15%">نوع</th>
            <th style="width:20%">شماره مرجع</th>
            <th style="width:30%">مبلغ (تومان)</th>
          </tr>
        </thead>
        <tbody>${paymentsRows}</tbody>
      </table>
    `
  }

  // ---------- اطلاعات طرف حساب ----------
  const partyRows = party
    ? [
        kvRow('نام / شرکت', esc(party.name)),
        party.national_code
          ? kvRow('کد ملی / شناسه ملی', esc(party.national_code))
          : '',
        party.contact_person
          ? kvRow('شخص تماس', esc(party.contact_person))
          : '',
        party.phone ? kvRow('تلفن', esc(party.phone)) : '',
        party.mobile ? kvRow('موبایل', esc(party.mobile)) : '',
        party.email ? kvRow('ایمیل', esc(party.email)) : '',
        party.address ? kvRow('آدرس', esc(party.address)) : '',
      ].join('')
    : kvRow(partyLabel, 'ثبت نشده')

  const companySub = [companyPhone, companyEmail].filter(Boolean).join(' | ')

  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<title>فاکتور ${invoice.invoice_number}</title>
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Tahoma, 'Segoe UI', Arial, sans-serif; color:#111827; margin:0; padding:28px; font-size:12px; }
  .page { max-width: 900px; margin: 0 auto; border:1px solid #d1d5db; border-radius:10px; overflow:hidden; }

  /* ---------- هدر ---------- */
  .doc-header { display:flex; justify-content:space-between; align-items:center; padding:18px 22px; background:#f8fafc; border-bottom:3px solid #2563eb; }
  .brand { display:flex; align-items:center; gap:12px; }
  .logo { width:56px; height:56px; object-fit:cover; border-radius:12px; border:1px solid #e5e7eb; background:#fff; }
  .logo-ph { width:56px; height:56px; border-radius:12px; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:bold; }
  .company { font-size:16px; font-weight:bold; color:#1f2937; }
  .company-sub { font-size:10px; color:#6b7280; margin-top:3px; }
  .doc-title { text-align:left; }
  .doc-type { font-size:11px; color:#2563eb; font-weight:bold; }
  .doc-title h1 { margin:2px 0; font-size:20px; color:#111827; }
  .status-pill { display:inline-block; padding:3px 10px; border-radius:999px; font-size:10px; font-weight:bold; background:#e0e7ff; color:#3730a3; }

  /* ---------- بدنه ---------- */
  .body { padding:20px 22px; }
  .section-title { font-size:12px; font-weight:bold; color:#1f2937; border-right:4px solid #2563eb; padding-right:8px; margin:18px 0 10px; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .box { border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; }
  .box-head { background:#f3f4f6; padding:7px 12px; font-weight:bold; font-size:11px; color:#374151; border-bottom:1px solid #e5e7eb; }
  table.kv { width:100%; border-collapse:collapse; }
  table.kv td { padding:6px 12px; font-size:11px; border-bottom:1px dashed #e5e7eb; }
  table.kv tr:last-child td { border-bottom:none; }
  table.kv .k { color:#6b7280; width:38%; }
  table.kv .v { color:#111827; font-weight:bold; }

  /* ---------- جدول اقلام ---------- */
  table.items { width:100%; border-collapse:collapse; margin-top:6px; }
  table.items th { background:#2563eb; color:#fff; padding:8px 6px; font-size:11px; border:1px solid #1d4ed8; }
  table.items td { padding:7px 6px; font-size:11px; border:1px solid #e5e7eb; }
  table.items tr:nth-child(even) td { background:#f9fafb; }
  .c { text-align:center; } .l { text-align:left; } .r { text-align:right; }
  .bold { font-weight:bold; }

  /* ---------- جمع‌ها ---------- */
  .totals-wrap { display:grid; grid-template-columns:1fr 320px; gap:14px; margin-top:14px; }
  table.totals { width:100%; border-collapse:collapse; }
  table.totals td { padding:7px 12px; font-size:11px; border:1px solid #e5e7eb; }
  table.totals tr.final td { background:#2563eb; color:#fff; font-weight:bold; font-size:13px; }
  .notes-box { border:1px solid #e5e7eb; border-radius:8px; padding:10px 12px; font-size:11px; color:#374151; background:#fffbeb; min-height:90px; }

  /* ---------- امضاء ---------- */
  .sign-grid { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:34px; }
  .sign-box { border-top:1px dashed #9ca3af; padding-top:8px; text-align:center; font-size:10px; color:#6b7280; }

  .footer { margin-top:22px; border-top:1px solid #e5e7eb; padding-top:10px; text-align:center; color:#9ca3af; font-size:9px; }
</style>
</head>
<body>
<div class="page">

  <!-- هدر -->
  <div class="doc-header">
    <div class="brand">
      ${companyLogo ? `<img class="logo" src="${companyLogo}" alt="لوگو" />` : `<div class="logo-ph">ح</div>`}
      <div>
        <div class="company">${esc(companyName)}</div>
        <div class="company-sub">${esc(companySub)}${companyAddress ? ' | ' + esc(companyAddress) : ''}</div>
      </div>
    </div>
    <div class="doc-title">
      <div class="doc-type">${typeLabels[invoice.invoice_type] || invoice.invoice_type}</div>
      <h1>شماره: ${invoice.invoice_number}</h1>
      <span class="status-pill">${statusLabels[invoice.status] || invoice.status}${invoice.is_official ? ' | رسمی' : ''}</span>
    </div>
  </div>

  <div class="body">

    <!-- اطلاعات طرف حساب + اطلاعات فاکتور -->
    <div class="grid-2">
      <div class="box">
        <div class="box-head">اطلاعات ${partyLabel}</div>
        <table class="kv">${partyRows}</table>
      </div>
      <div class="box">
        <div class="box-head">اطلاعات سند</div>
        <table class="kv">
          ${kvRow('تاریخ صدور', faDate(invoice.issue_date))}
          ${kvRow('تاریخ سررسید', faDate(invoice.due_date))}
          ${kvRow('نوع سند', typeLabels[invoice.invoice_type] || invoice.invoice_type)}
          ${kvRow('وضعیت', statusLabels[invoice.status] || invoice.status)}
          ${kvRow('رسمی', invoice.is_official ? 'بله' : 'خیر')}
        </table>
      </div>
    </div>

    <!-- اقلام -->
    <div class="section-title">اقلام فاکتور</div>
    <table class="items">
      <thead>
        <tr>
          <th style="width:6%">ردیف</th>
          <th style="width:34%">شرح کالا / خدمات</th>
          <th style="width:10%">تعداد</th>
          <th style="width:9%">واحد</th>
          <th style="width:14%">قیمت واحد (تومان)</th>
          <th style="width:12%">تخفیف (تومان)</th>
          <th style="width:15%">جمع کل (تومان)</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <!-- ✅ تاریخچه پرداخت‌ها -->
    ${paymentsSection}

    <!-- جمع‌ها + یادداشت -->
    <div class="totals-wrap">
      <div>
        <div class="section-title" style="margin-top:0">یادداشت‌ها</div>
        <div class="notes-box">${esc(invoice.notes || '—')}</div>
      </div>
      <div>
        <div class="section-title" style="margin-top:0">خلاصه مالی</div>
        <table class="totals">
          <tr><td class="r">جمع کل</td><td class="l">${faPrice(invoice.subtotal)}</td></tr>
          <tr><td class="r">تخفیف</td><td class="l">${faPrice(invoice.discount_amount)}</td></tr>
          <tr><td class="r">مالیات (${invoice.tax_percent}%)</td><td class="l">${faPrice(invoice.tax_amount)}</td></tr>
          <tr class="final"><td class="r">مبلغ نهایی</td><td class="l">${faPrice(invoice.total_amount)} تومان</td></tr>
          <tr><td class="r">پرداخت شده</td><td class="l">${faPrice(invoice.paid_amount)}</td></tr>
          <tr><td class="r">مانده</td><td class="l">${faPrice(invoice.remaining_amount)}</td></tr>
        </table>
      </div>
    </div>

    <!-- امضاء -->
    <div class="sign-grid">
      <div class="sign-box">مهر و امضاء فروشنده</div>
      <div class="sign-box">مهر و امضاء خریدار</div>
    </div>

    <div class="footer">این سند توسط ${esc(companyName)} تولید شده و بدون مهر و امضاء فاقد اعتبار است.</div>
  </div>
</div>

<script>
  window.onload = function () { window.focus(); window.print(); };
</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=1000,height=800')
  if (!win) return false
  win.document.open()
  win.document.write(html)
  win.document.close()
  return true
}
