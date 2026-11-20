import {
  Supplier,
  SupplierCreate,
  SupplierListResponse,
  SupplierUpdate,
} from '@/types/supplier'
import api from './api'

export const supplierService = {
  getSuppliers: async (params?: {
    skip?: number
    limit?: number
    search?: string
    is_active?: boolean
    has_balance?: boolean
  }) => {
    const response = await api.get<SupplierListResponse>('/suppliers/', {
      params,
    })
    return response.data
  },

  getSupplierById: async (id: number) => {
    const response = await api.get<Supplier>(`/suppliers/${id}`)
    return response.data
  },

  createSupplier: async (data: SupplierCreate) => {
    const response = await api.post<Supplier>('/suppliers/', data)
    return response.data
  },

  updateSupplier: async (id: number, data: SupplierUpdate) => {
    const response = await api.put<Supplier>(`/suppliers/${id}`, data)
    return response.data
  },

  deleteSupplier: async (id: number) => {
    await api.delete(`/suppliers/${id}`)
  },

  getDropdown: async () => {
    const response = await api.get('/suppliers/dropdown')
    return response.data
  },
}
