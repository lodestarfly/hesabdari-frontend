import api from './api'

export interface UserProfile {
  id: number
  username: string
  full_name: string
  email?: string
  phone?: string
  role: string
  is_active: boolean
  is_superuser: boolean
  avatar_url?: string | null
  created_at: string
  updated_at?: string
  last_login?: string | null
}

export interface PasswordChange {
  current_password: string
  new_password: string
  confirm_password?: string
}

export interface SystemSettings {
  company_name: string
  company_logo?: string
  phone?: string
  email?: string
  address?: string
  tax_percent?: number
  currency?: string
}

export const settingsService = {
  // دریافت پروفایل کاربر فعلی
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/users/me')
    return response.data
  },

  // به‌روزرسانی پروفایل با FormData (پشتیبانی از آپلود آواتار)
  updateProfile: async (data: {
    full_name?: string
    email?: string
    phone?: string
    avatar?: File | null
  }): Promise<UserProfile> => {
    const formData = new FormData()

    if (data.full_name !== undefined)
      formData.append('full_name', data.full_name)
    if (data.email !== undefined) formData.append('email', data.email || '')
    if (data.phone !== undefined) formData.append('phone', data.phone || '')
    if (data.avatar) formData.append('avatar', data.avatar)

    const response = await api.put<UserProfile>('/users/me', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // تغییر رمز عبور
  changePassword: async (data: PasswordChange) => {
    const response = await api.put('/users/me/password', {
      current_password: data.current_password,
      new_password: data.new_password,
    })
    return response.data
  },

  // دریافت تنظیمات سیستم
  getSystemSettings: async () => {
    const response = await api.get<SystemSettings>('/settings/system')
    return response.data
  },

  // به‌روزرسانی تنظیمات سیستم
  updateSystemSettings: async (data: Partial<SystemSettings>) => {
    const response = await api.put<SystemSettings>('/settings/system', data)
    return response.data
  },

  // دریافت لاگ‌های سیستم
  getAuditLogs: async (params?: {
    skip?: number
    limit?: number
    user_id?: number
    action?: string
    table_name?: string
  }) => {
    const response = await api.get('/audit-logs/', { params })
    return response.data
  },
}
