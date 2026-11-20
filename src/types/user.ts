export interface User {
  id: number
  username: string
  full_name: string
  email: string | null
  phone: string | null
  role: 'admin' | 'manager' | 'sales' | 'warehouse' | 'accountant' | 'viewer'
  is_active: boolean
  is_superuser: boolean
  last_login: string | null
  created_at: string
  updated_at: string | null
}

export interface UserListResponse {
  total: number
  users: User[]
}

export interface UserCreate {
  username: string
  full_name: string
  email?: string
  phone?: string
  role: User['role']
  password: string
}

export interface UserUpdate {
  full_name?: string
  email?: string
  phone?: string
  role?: User['role']
  is_active?: boolean
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export const roleLabels: Record<User['role'], string> = {
  admin: 'مدیر سیستم',
  manager: 'مدیر',
  sales: 'فروشنده',
  warehouse: 'انباردار',
  accountant: 'حسابدار',
  viewer: 'فقط مشاهده',
}

export const roleColors: Record<User['role'], 'success' | 'info' | 'warning' | 'neutral' | 'danger'> = {
  admin: 'danger',
  manager: 'info',
  sales: 'success',
  warehouse: 'warning',
  accountant: 'info',
  viewer: 'neutral',
}