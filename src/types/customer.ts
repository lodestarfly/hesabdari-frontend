export type CustomerType = 'real' | 'legal'

export interface Customer {
  id: number
  customer_type: CustomerType
  name: string
  national_code: string | null
  economic_code: string | null
  registration_no: string | null
  phone: string | null
  mobile: string | null
  email: string | null
  address: string | null
  postal_code: string | null
  credit_limit: number
  payment_terms: number
  balance: number
  bank_card_number: string | null
  bank_account: string | null
  iban: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface CustomerListResponse {
  total: number
  customers: Customer[]
}

export interface CustomerCreate {
  customer_type: CustomerType
  name: string
  national_code?: string
  economic_code?: string
  registration_no?: string
  phone?: string
  mobile?: string
  email?: string
  address?: string
  postal_code?: string
  credit_limit?: number
  payment_terms?: number
  bank_card_number?: string
  bank_account?: string
  iban?: string
  notes?: string
  is_active?: boolean
}

export interface CustomerUpdate {
  name?: string
  national_code?: string
  economic_code?: string
  registration_no?: string
  phone?: string
  mobile?: string
  email?: string
  address?: string
  postal_code?: string
  credit_limit?: number
  payment_terms?: number
  bank_card_number?: string
  bank_account?: string
  iban?: string
  notes?: string
  is_active?: boolean
}

export const customerTypeLabels: Record<CustomerType, string> = {
  real: 'حقیقی',
  legal: 'حقوقی',
}

export const customerTypeColors: Record<CustomerType, 'info' | 'warning'> = {
  real: 'info',
  legal: 'warning',
}