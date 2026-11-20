import {
  Customer,
  CustomerCreate,
  CustomerListResponse,
  CustomerUpdate,
} from '@/types/customer'
import api from './api'

export const customerService = {
  getCustomers: async (params?: {
    skip?: number
    limit?: number
    search?: string
    customer_type?: string
    is_active?: boolean
    has_balance?: boolean
  }) => {
    const response = await api.get<CustomerListResponse>('/customers/', {
      params,
    })
    return response.data
  },

  getCustomerById: async (id: number) => {
    const response = await api.get<Customer>(`/customers/${id}`)
    return response.data
  },

  createCustomer: async (data: CustomerCreate) => {
    const response = await api.post<Customer>('/customers/', data)
    return response.data
  },

  updateCustomer: async (id: number, data: CustomerUpdate) => {
    const response = await api.put<Customer>(`/customers/${id}`, data)
    return response.data
  },

  deleteCustomer: async (id: number) => {
    await api.delete(`/customers/${id}`)
  },

  getDropdown: async () => {
    const response = await api.get('/customers/dropdown')
    return response.data
  },
}
