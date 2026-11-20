import api from './api'
import { User, UserListResponse, UserCreate, UserUpdate, ChangePasswordRequest } from '@/types/user'

export const userService = {
  getUsers: async (params?: {
    skip?: number
    limit?: number
    search?: string
    role?: string
    is_active?: boolean
  }) => {
    const response = await api.get<UserListResponse>('/users/', { params })
    return response.data
  },

  getUserById: async (id: number) => {
    const response = await api.get<User>(`/users/${id}`)
    return response.data
  },

  createUser: async (data: UserCreate) => {
    const response = await api.post<User>('/users/', data)
    return response.data
  },

  updateUser: async (id: number, data: UserUpdate) => {
    const response = await api.put<User>(`/users/${id}`, data)
    return response.data
  },

  toggleUserStatus: async (id: number) => {
    const response = await api.put<User>(`/users/${id}/toggle-status`)
    return response.data
  },

  deleteUser: async (id: number) => {
    await api.delete(`/users/${id}`)
  },

  changePassword: async (id: number, data: ChangePasswordRequest) => {
    const response = await api.put(`/users/${id}/change-password`, data)
    return response.data
  },

  changeMyPassword: async (data: ChangePasswordRequest) => {
    const response = await api.put('/users/me/password', data)
    return response.data
  },
}