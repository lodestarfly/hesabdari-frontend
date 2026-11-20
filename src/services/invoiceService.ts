import {
  Invoice,
  InvoiceCreate,
  InvoiceListResponse,
  PaymentCreate,
} from '@/types/invoice'
import api from './api'

export const invoiceService = {
  getInvoices: async (params?: {
    skip?: number
    limit?: number
    search?: string
    invoice_type?: string
    status?: string
    customer_id?: number
    supplier_id?: number
  }) => {
    const response = await api.get<InvoiceListResponse>('/invoices/', {
      params,
    })
    return response.data
  },

  getInvoiceById: async (id: number) => {
    const response = await api.get<Invoice>(`/invoices/${id}`)
    return response.data
  },

  createInvoice: async (data: InvoiceCreate) => {
    const response = await api.post<Invoice>('/invoices/', data)
    return response.data
  },

  convertProformaToInvoice: async (id: number) => {
    const response = await api.put<Invoice>(`/invoices/${id}/convert`)
    return response.data
  },

  cancelInvoice: async (id: number, reason: string) => {
    const response = await api.put<Invoice>(`/invoices/${id}/cancel`, null, {
      params: { reason },
    })
    return response.data
  },

  // ✅ اصلاح شده: اضافه کردن invoice_id به body
  addPayment: async (invoiceId: number, data: PaymentCreate) => {
    const response = await api.post(`/invoices/${invoiceId}/payments`, {
      ...data,
      invoice_id: invoiceId, // ✅ اضافه شد
    })
    return response.data
  },

  // ✅ متد جدید: دریافت پرداخت‌های یک فاکتور
  getInvoicePayments: async (invoiceId: number) => {
    const response = await api.get(`/invoices/${invoiceId}/payments`)
    return response.data
  },

  // ✅ متد جدید: حذف پرداخت
  deletePayment: async (invoiceId: number, paymentId: number) => {
    const response = await api.delete(
      `/invoices/${invoiceId}/payments/${paymentId}`
    )
    return response.data
  },

  // ✅ متد جدید: دریافت لیست همه پرداخت‌ها
  getPayments: async (params?: {
    skip?: number
    limit?: number
    search?: string
    payment_type?: string
    payment_method?: string
    invoice_id?: number
  }) => {
    const response = await api.get('/payments/', { params })
    return response.data
  },
}
