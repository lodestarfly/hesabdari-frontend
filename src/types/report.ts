export interface SalesReportData {
  date: string
  invoice_count: number
  total_sales: number
  total_paid: number
  total_remaining: number
}

export interface SalesReport {
  period: string
  group_by: string
  data: SalesReportData[]
}

export interface InventoryProduct {
  id: number
  code: string
  name: string
  unit: string
  stock_qty: number
  min_stock: number
  retail_price: number
  cost_price: number
  stock_value: number
  is_low_stock: boolean
}

export interface InventoryReport {
  total_products: number
  total_inventory_value: number
  low_stock_count: number
  products: InventoryProduct[]
}

export interface CustomerBalance {
  id: number
  name: string
  type: string
  balance: number
  credit_limit: number
  credit_usage_percent: number
}

export interface CustomerBalanceReport {
  total_customers_with_balance: number
  total_receivable: number
  customers: CustomerBalance[]
}

export interface SupplierBalance {
  id: number
  name: string
  balance: number
}

export interface SupplierBalanceReport {
  total_suppliers_with_balance: number
  total_payable: number
  suppliers: SupplierBalance[]
}

export interface ProfitLossReport {
  period: string
  total_sales: number
  total_purchases: number
  gross_profit: number
  profit_margin: number
}

export type ReportTab =
  | 'sales'
  | 'inventory'
  | 'customer-balance'
  | 'supplier-balance'
  | 'profit-loss'
