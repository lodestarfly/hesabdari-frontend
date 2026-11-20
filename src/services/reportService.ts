import {
  CustomerBalanceReport,
  InventoryReport,
  ProfitLossReport,
  SalesReport,
  SupplierBalanceReport,
} from '@/types/report'
import api from './api'

export const reportService = {
  getSalesReport: async (params?: {
    start_date?: string
    end_date?: string
    group_by?: 'day' | 'month' | 'year'
    export_format?: 'excel' | 'json'
  }) => {
    const response = await api.get<SalesReport>('/reports/sales', { params })
    return response.data
  },

  getInventoryReport: async (params?: {
    low_stock_only?: boolean
    export_format?: 'excel' | 'json'
  }) => {
    const response = await api.get<InventoryReport>('/reports/inventory', {
      params,
    })
    return response.data
  },

  getCustomerBalanceReport: async () => {
    const response = await api.get<CustomerBalanceReport>(
      '/reports/customer-balance'
    )
    return response.data
  },

  getSupplierBalanceReport: async () => {
    const response = await api.get<SupplierBalanceReport>(
      '/reports/supplier-balance'
    )
    return response.data
  },

  getProfitLossReport: async (params?: {
    start_date?: string
    end_date?: string
  }) => {
    const response = await api.get<ProfitLossReport>('/reports/profit-loss', {
      params,
    })
    return response.data
  },

  downloadSalesExcel: async (params?: {
    start_date?: string
    end_date?: string
    group_by?: string
  }) => {
    const response = await api.get('/reports/sales', {
      params: { ...params, export_format: 'excel' },
      responseType: 'blob',
    })
    return response.data
  },

  downloadInventoryExcel: async (params?: { low_stock_only?: boolean }) => {
    const response = await api.get('/reports/inventory', {
      params: { ...params, export_format: 'excel' },
      responseType: 'blob',
    })
    return response.data
  },
}
