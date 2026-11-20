import api from './api'

export interface AuditLog {
  id: number
  user_id?: number
  username?: string
  action: string
  table_name?: string
  record_id?: number
  old_values?: string
  new_values?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface AuditLogListResponse {
  total: number
  logs: AuditLog[]
}

export interface AuditStats {
  total_logs: number
  actions: { action: string; count: number }[]
  tables: { table: string; count: number }[]
}

export const auditService = {
  getAuditLogs: async (params?: {
    skip?: number
    limit?: number
    search?: string
    user_id?: number
    action?: string
    table_name?: string
    start_date?: string
    end_date?: string
  }) => {
    const response = await api.get<AuditLogListResponse>('/audit-logs/', {
      params,
    })
    return response.data
  },

  getAuditStats: async () => {
    const response = await api.get<AuditStats>('/audit-logs/stats')
    return response.data
  },
}
