export type InvoiceType = 'sale' | 'purchase' | 'proforma'
export type InvoiceStatus = 'draft' | 'confirmed' | 'cancelled' | 'paid'
export type PaymentMethod = 'cash' | 'card' | 'check' | 'transfer'
export type PaymentType = 'receipt' | 'payment'

export interface InvoiceItem {
  id?: number
  product_id: number
  description: string | null
  quantity: number
  unit_price: number
  discount_amount: number
  discount_percent: number
  total_price: number
  row_number: number
}

export interface Invoice {
  id: number
  invoice_number: string
  serial_number: string | null
  invoice_type: InvoiceType
  status: InvoiceStatus
  customer_id: number | null
  supplier_id: number | null
  user_id: number
  issue_date: string
  due_date: string | null
  subtotal: number
  discount_amount: number
  discount_percent: number
  tax_amount: number
  tax_percent: number
  total_amount: number
  paid_amount: number
  remaining_amount: number
  is_official: boolean
  approved_by: number | null
  approved_at: string | null
  cancellation_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string | null
  items: InvoiceItem[]
}

export interface InvoiceListResponse {
  total: number
  invoices: Invoice[]
}

export interface InvoiceCreate {
  invoice_type: InvoiceType
  customer_id?: number | null
  supplier_id?: number | null
  due_date?: string | null
  discount_amount?: number
  discount_percent?: number
  tax_percent?: number
  is_official?: boolean
  notes?: string
  items: InvoiceItemCreate[]
}

export interface InvoiceItemCreate {
  product_id: number
  description?: string
  quantity: number
  unit_price: number
  discount_amount?: number
  discount_percent?: number
  row_number: number
}

export interface PaymentCreate {
  invoice_id?: number
  amount: number
  payment_method: PaymentMethod
  reference_number?: string
  payment_type: PaymentType
  notes?: string
}

export const invoiceTypeLabels: Record<InvoiceType, string> = {
  sale: 'فروش',
  purchase: 'خرید',
  proforma: 'پیش‌فاکتور',
}

export const invoiceTypeColors: Record<
  InvoiceType,
  'success' | 'info' | 'warning'
> = {
  sale: 'success',
  purchase: 'info',
  proforma: 'warning',
}

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: 'پیش‌نویس',
  confirmed: 'تایید شده',
  cancelled: 'لغو شده',
  paid: 'پرداخت شده',
}

export const invoiceStatusColors: Record<
  InvoiceStatus,
  'neutral' | 'success' | 'danger' | 'info'
> = {
  draft: 'neutral',
  confirmed: 'success',
  cancelled: 'danger',
  paid: 'info',
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'نقدی',
  card: 'کارتخوان',
  check: 'چک',
  transfer: 'انتقال بانکی',
}
