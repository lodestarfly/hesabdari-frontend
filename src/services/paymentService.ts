import api from './api'

export interface Payment {
  id: number
  invoice_id: number
  invoice_number?: string // ✅ این فیلد باید وجود داشته باشد
  amount: number
  payment_method: string
  reference_number?: string
  payment_type: 'receipt' | 'payment'
  notes?: string
  created_by?: number
  created_at?: string
  updated_at?: string
}

export interface PaymentCreate {
  invoice_id: number
  amount: number
  payment_method: string
  reference_number?: string
  payment_type: 'receipt' | 'payment'
  notes?: string
}

export interface PaymentListResponse {
  total: number
  payments: Payment[]
}

export const paymentService = {
  getPayments: async (params?: {
    skip?: number
    limit?: number
    search?: string
    payment_type?: string
    payment_method?: string
    invoice_id?: number
  }) => {
    const response = await api.get<PaymentListResponse>('/payments/', {
      params,
    })
    return response.data
  },

  getPaymentById: async (id: number) => {
    const response = await api.get<Payment>(`/payments/${id}`)
    return response.data
  },

  createPayment: async (data: PaymentCreate) => {
    const response = await api.post<Payment>('/payments/', data)
    return response.data
  },

  deletePayment: async (id: number) => {
    await api.delete(`/payments/${id}`)
  },

  getInvoicePayments: async (invoiceId: number) => {
    const response = await api.get<Payment[]>(`/payments/invoice/${invoiceId}`)
    return response.data
  },
}
