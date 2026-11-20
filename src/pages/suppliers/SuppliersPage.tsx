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
  HiOutlineUser,
} from 'react-icons/hi'

import { supplierService } from '@/services/supplierService'
import { useAuthStore } from '@/store/authStore'
import { Supplier } from '@/types/supplier'

import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import SupplierFormModal from './SupplierFormModal.tsx'

export default function SuppliersPage() {
  const queryClient = useQueryClient()
  const { token } = useAuthStore()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [balanceFilter, setBalanceFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const limit = 10

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null
  )

  // Fetch Suppliers
  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, search, statusFilter, balanceFilter],
    queryFn: () =>
      supplierService.getSuppliers({
        skip: page * limit,
        limit,
        search: search || undefined,
        is_active: statusFilter ? statusFilter === 'active' : undefined,
        has_balance: balanceFilter ? balanceFilter === 'yes' : undefined,
      }),
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => supplierService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('تامین‌کننده با موفقیت حذف شد')
      setIsConfirmOpen(false)
      setSupplierToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'خطا در حذف تامین‌کننده')
    },
  })

  // ✅ Recalculate Balances
  const handleRecalculateBalances = async () => {
    if (
      !confirm('آیا از به‌روزرسانی مانده حساب همه تامین‌کنندگان اطمینان دارید؟')
    ) {
      return
    }

    setIsRecalculating(true)
    try {
      const response = await fetch(
        'http://localhost:8000/api/v1/suppliers/recalculate-balances',
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
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    } catch (error) {
      console.error('Recalculate error:', error)
      toast.error('خطا در به‌روزرسانی مانده حساب‌ها')
    } finally {
      setIsRecalculating(false)
    }
  }

  const handleDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier)
    setIsConfirmOpen(true)
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setIsFormModalOpen(true)
  }

  const handleCreate = () => {
    setEditingSupplier(null)
    setIsFormModalOpen(true)
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price)
  }

  const formatNationalCode = (code: string | null | undefined) => {
    if (!code) return '—'
    // فرمت شناسه ملی: XXX-XXXXXX-X
    return code.replace(/(\d{3})(\d{6})(\d{1})/, '$1-$2-$3')
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            مدیریت تامین‌کنندگان
          </h1>
          <p className="text-gray-500 mt-1">
            {data ? `${data.total} تامین‌کننده ثبت شده` : 'در حال بارگذاری...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ دکمه به‌روزرسانی مانده حساب‌ها */}
          <button
            onClick={handleRecalculateBalances}
            disabled={isRecalculating}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            title="به‌روزرسانی مانده حساب همه تامین‌کنندگان"
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
            تامین‌کننده جدید
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        ) : data && data.suppliers.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      تامین‌کننده
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      شخص تماس
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      تماس
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      مانده حساب
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
                  {data.suppliers.map((supplier) => {
                    const balance = supplier.balance || 0

                    return (
                      <tr
                        key={supplier.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Supplier Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                              {supplier.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">
                                {supplier.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                کد ملی:{' '}
                                {formatNationalCode(supplier.national_code)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact Person */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <HiOutlineUser className="w-4 h-4 text-gray-400" />
                            {supplier.contact_person || '—'}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {supplier.mobile && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <HiOutlinePhone className="w-3 h-3" />
                                {supplier.mobile}
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <HiOutlineMail className="w-3 h-3" />
                                {supplier.email}
                              </div>
                            )}
                            {!supplier.mobile && !supplier.email && (
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
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <Badge
                            variant={supplier.is_active ? 'success' : 'danger'}
                          >
                            {supplier.is_active ? 'فعال' : 'غیرفعال'}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(supplier)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="ویرایش"
                            >
                              <HiOutlinePencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(supplier)}
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
            title="تامین‌کننده یافت نشد"
            description="هنوز تامین‌کننده‌ای ثبت نشده یا با فیلترهای شما مطابقت ندارد"
          />
        )}
      </div>

      {/* Supplier Form Modal */}
      <SupplierFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingSupplier(null)
        }}
        supplier={editingSupplier}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['suppliers'] })
          setIsFormModalOpen(false)
          setEditingSupplier(null)
        }}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setSupplierToDelete(null)
        }}
        onConfirm={() =>
          supplierToDelete && deleteMutation.mutate(supplierToDelete.id)
        }
        title="حذف تامین‌کننده"
        message={`آیا از حذف تامین‌کننده "${supplierToDelete?.name}" اطمینان دارید؟ در صورت وجود فاکتور، امکان حذف وجود ندارد.`}
        confirmText="حذف"
        cancelText="انصراف"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
