export interface Supplier {
  id: number
  name: string
  national_code?: string
  phone?: string
  mobile?: string
  email?: string
  address?: string
  contact_person?: string
  balance: number
  bank_card_number?: string
  bank_account?: string
  iban?: string
  is_active: boolean
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface SupplierListResponse {
  total: number
  suppliers: Supplier[]
}

export interface SupplierListResponse {
  total: number
  suppliers: Supplier[]
}

export interface SupplierCreate {
  name: string
  national_code?: string
  phone?: string
  mobile?: string
  email?: string
  address?: string
  contact_person?: string
  bank_card_number?: string
  bank_account?: string
  iban?: string
  notes?: string
  is_active?: boolean
}

export interface SupplierUpdate {
  name?: string
  national_code?: string
  phone?: string
  mobile?: string
  email?: string
  address?: string
  contact_person?: string
  bank_card_number?: string
  bank_account?: string
  iban?: string
  notes?: string
  is_active?: boolean
}
