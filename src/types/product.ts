import { Category } from './category'

export interface Product {
  id: number
  code: string
  barcode: string | null
  name: string
  category_id: number | null
  unit: string
  cost_price: number
  retail_price: number
  wholesale_price: number
  min_wholesale_qty: number
  corporate_price: number
  stock_qty: number
  min_stock: number
  image_url: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
  category?: Category | null
}

export interface ProductListResponse {
  total: number
  products: Product[]
}

export interface ProductCreate {
  code: string
  barcode?: string
  name: string
  category_id?: number | null
  unit: string
  cost_price: number
  retail_price: number
  wholesale_price: number
  min_wholesale_qty: number
  corporate_price: number
  stock_qty: number
  min_stock: number
  description?: string
  is_active?: boolean
}

export interface ProductUpdate {
  barcode?: string
  name?: string
  category_id?: number | null
  unit?: string
  cost_price?: number
  retail_price?: number
  wholesale_price?: number
  min_wholesale_qty?: number
  corporate_price?: number
  stock_qty?: number
  min_stock?: number
  description?: string
  is_active?: boolean
}

export const unitOptions = [
  'عدد',
  'کیلوگرم',
  'گرم',
  'متر',
  'سانتی‌متر',
  'لیتر',
  'میلی‌لیتر',
  'بسته',
  'کارتن',
  'جعبه',
  'دستگاه',
  'جلد',
]