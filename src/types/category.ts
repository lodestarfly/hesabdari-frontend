export interface Category {
  id: number
  name: string
  description: string | null
  parent_id: number | null
  created_at: string
  updated_at: string | null
  children?: Category[]
}

export interface CategoryCreate {
  name: string
  description?: string
  parent_id?: number | null
}

export interface CategoryUpdate {
  name?: string
  description?: string
  parent_id?: number | null
}
