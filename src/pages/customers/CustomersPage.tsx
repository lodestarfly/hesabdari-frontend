import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  HiOutlineMail,
  HiOutlinePencil,
  HiOutlinePhone,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineTrash,
} from 'react-icons/hi'

import { customerService } from '@/services/customerService'
import { useAuthStore } from '@/store/authStore'
import {
  Customer,
  customerTypeColors,
  customerTypeLabels,
} from '@/types/customer'

import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import CustomerFormModal from './CustomerFormModal.tsx'

export default function CustomersPage() {
  const queryClient = useQueryClient()
  const { token } = useAuthStore()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [balanceFilter, setBalanceFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const limit = 10

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  )

  // Fetch Customers
  const { data, isLoading } = useQuery({
    queryKey: [
      'customers',
      page,
      search,
      typeFilter,
      statusFilter,
      balanceFilter,
    ],
    queryFn: () =>
      customerService.getCustomers({
        skip: page * limit,
        limit,
        search: search || undefined,
        customer_type: typeFilter || undefined,
        is_active: statusFilter ? statusFilter === 'active' : undefined,
        has_balance: balanceFilter ? balanceFilter === 'yes' : undefined,
      }),
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => customerService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('مشتری با موفقیت حذف شد')
      setIsConfirmOpen(false)
      setCustomerToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'خطا در حذف مشتری')
    },
  })

  // ✅ Recalculate Balances
  const handleRecalculateBalances = async () => {
    if (!confirm('آیا از به‌روزرسانی مانده حساب همه مشتریان اطمینان دارید؟')) {
      return
    }

    setIsRecalculating(true)
    try {
      const response = await fetch(
        'http://localhost:8000/api/v1/customers/recalculate-balances',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('خطا در به‌روزرسانی')
      }

      const result = await response.json()
      toast.success(result.message || 'مانده حساب‌ها به‌روز شد')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    } catch (error) {
      console.error('Recalculate error:', error)
      toast.error('خطا در به‌روزرسانی مانده حساب‌ها')
    } finally {
      setIsRecalculating(false)
    }
  }

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer)
    setIsConfirmOpen(true)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsFormModalOpen(true)
  }

  const handleCreate = () => {
    setEditingCustomer(null)
    setIsFormModalOpen(true)
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price)
  }

  const formatNationalCode = (code: string | null, type: string) => {
    if (!code) return '—'
    if (type === 'real') {
      // فرمت کد ملی: XXX-XXXXXX-X
      return code.replace(/(\d{3})(\d{6})(\d{1})/, '$1-$2-$3')
    }
    return code
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مدیریت مشتریان</h1>
          <p className="text-gray-500 mt-1">
            {data ? `${data.total} مشتری ثبت شده` : 'در حال بارگذاری...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ دکمه به‌روزرسانی مانده حساب‌ها */}
          <button
            onClick={handleRecalculateBalances}
            disabled={isRecalculating}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            title="به‌روزرسانی مانده حساب همه مشتریان"
          >
            <HiOutlineRefresh
              className={`w-5 h-5 ${isRecalculating ? 'animate-spin' : ''}`}
            />
            {isRecalculating ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی مانده'}
          </button>

          <button
            onClick={handleCreate}
            className="btn-primary flex items-center gap-2"
          >
            <HiOutlinePlus className="w-5 h-5" />
            مشتری جدید
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <HiOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در نام، کد ملی، تلفن..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="input-field pr-10"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(0)
            }}
            className="input-field"
          >
            <option value="">همه انواع</option>
            <option value="real">حقیقی</option>
            <option value="legal">حقوقی</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(0)
            }}
            className="input-field"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="active">فعال</option>
            <option value="inactive">غیرفعال</option>
          </select>

          {/* Balance Filter */}
          <select
            value={balanceFilter}
            onChange={(e) => {
              setBalanceFilter(e.target.value)
              setPage(0)
            }}
            className="input-field"
          >
            <option value="">همه مانده‌ها</option>
            <option value="yes">دارای مانده</option>
            <option value="no">بدون مانده</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : data && data.customers.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      مشتری
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      نوع
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      تماس
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      مانده حساب
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      سقف اعتبار
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      وضعیت
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.customers.map((customer) => {
                    // ✅ اصلاح فرمول: فقط برای balance مثبت (بدهکار) و credit_limit > 0
                    const balance = customer.balance || 0
                    const creditLimit = customer.credit_limit || 0

                    const balancePercent =
                      balance > 0 && creditLimit > 0
                        ? (balance / creditLimit) * 100
                        : 0

                    const isOverCredit = balancePercent > 100

                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Customer Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                                customer.customer_type === 'legal'
                                  ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
                              }`}
                            >
                              {customer.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">
                                {customer.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {customer.customer_type === 'legal'
                                  ? 'شناسه ملی'
                                  : 'کد ملی'}
                                :{' '}
                                {formatNationalCode(
                                  customer.national_code,
                                  customer.customer_type
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4">
                          <Badge
                            variant={customerTypeColors[customer.customer_type]}
                          >
                            {customerTypeLabels[customer.customer_type]}
                          </Badge>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {customer.mobile && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <HiOutlinePhone className="w-3 h-3" />
                                {customer.mobile}
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <HiOutlineMail className="w-3 h-3" />
                                {customer.email}
                              </div>
                            )}
                            {!customer.mobile && !customer.email && (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        </td>

                        {/* Balance */}
                        <td className="px-6 py-4">
                          <div>
                            <p
                              className={`font-bold text-sm ${
                                balance > 0
                                  ? 'text-red-600'
                                  : balance < 0
                                    ? 'text-green-600'
                                    : 'text-gray-600'
                              }`}
                            >
                              {formatPrice(Math.abs(balance))}
                              <span className="text-xs font-normal mr-1">
                                تومان
                              </span>
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {balance > 0
                                ? 'بدهکار'
                                : balance < 0
                                  ? 'بستانکار'
                                  : 'تسویه'}
                            </p>

                            {/* ✅ نمایش نوار پیشرفت فقط اگر بدهکار است و سقف اعتبار دارد */}
                            {balance > 0 && creditLimit > 0 && (
                              <div className="mt-1">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${isOverCredit ? 'bg-red-500' : 'bg-blue-500'}`}
                                    style={{
                                      width: `${Math.min(balancePercent, 100)}%`,
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {balancePercent.toFixed(0)}% از سقف اعتبار
                                </p>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Credit Limit */}
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {creditLimit > 0 ? (
                            <div>
                              <p className="font-medium">
                                {formatPrice(creditLimit)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {customer.payment_terms} روزه
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <Badge
                            variant={customer.is_active ? 'success' : 'danger'}
                          >
                            {customer.is_active ? 'فعال' : 'غیرفعال'}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(customer)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="ویرایش"
                            >
                              <HiOutlinePencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(customer)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <HiOutlineTrash className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  صفحه {page + 1} از {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    قبلی
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    بعدی
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="مشتری یافت نشد"
            description="هنوز مشتری ثبت نشده یا با فیلترهای شما مطابقت ندارد"
          />
        )}
      </div>

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingCustomer(null)
        }}
        customer={editingCustomer}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['customers'] })
          setIsFormModalOpen(false)
          setEditingCustomer(null)
        }}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setCustomerToDelete(null)
        }}
        onConfirm={() =>
          customerToDelete && deleteMutation.mutate(customerToDelete.id)
        }
        title="حذف مشتری"
        message={`آیا از حذف مشتری "${customerToDelete?.name}" اطمینان دارید؟ در صورت وجود فاکتور، امکان حذف وجود ندارد.`}
        confirmText="حذف"
        cancelText="انصراف"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
