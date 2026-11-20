import api from './api'

export interface Product {
  id: number
  code: string
  barcode?: string
  name: string
  category_id?: number | null
  unit: string
  cost_price?: number
  retail_price: number
  wholesale_price?: number
  min_wholesale_qty?: number
  corporate_price?: number
  stock_qty?: number
  min_stock?: number
  image_url?: string
  description?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ProductListResponse {
  total: number
  products: Product[]
}

export const productService = {
  getProducts: async (params?: {
    skip?: number
    limit?: number
    search?: string
    category_id?: number
    is_active?: boolean
    low_stock?: boolean
  }) => {
    const response = await api.get<ProductListResponse>('/products/', {
      params,
    })
    return response.data
  },

  getProductById: async (id: number) => {
    const response = await api.get<Product>(`/products/${id}`)
    return response.data
  },

  // ✅ متد ایجاد محصول
  create: async (formData: FormData) => {
    const response = await api.post<Product>('/products/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // ✅ متد به‌روزرسانی محصول
  update: async (id: number, formData: FormData) => {
    const response = await api.put<Product>(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/products/${id}`)
  },

  uploadImage: async (id: number, file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await api.post<Product>(
      `/products/${id}/upload-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },
}
