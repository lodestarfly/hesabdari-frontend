import { Category, CategoryCreate, CategoryUpdate } from '@/types/category'
import api from './api'

export const categoryService = {
  getTree: async () => {
    const response = await api.get<Category[]>('/categories/tree')
    return response.data
  },

  getAll: async () => {
    const response = await api.get<Category[]>('/categories/')
    return response.data
  },

  create: async (data: CategoryCreate) => {
    const response = await api.post<Category>('/categories/', data)
    return response.data
  },

  update: async (id: number, data: CategoryUpdate) => {
    const response = await api.put<Category>(`/categories/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/categories/${id}`)
  },
}
