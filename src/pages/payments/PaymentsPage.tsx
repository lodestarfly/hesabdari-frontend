import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineX,
} from 'react-icons/hi'

import { Payment, paymentService } from '@/services/paymentService'

import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import PaymentDetailModal from './PaymentDetailModal'
import PaymentFormModal from './PaymentFormModal'

const methodLabels: Record<string, string> = {
  cash: 'نقدی',
  card: 'کارت',
  check: 'چک',
  bank_transfer: 'انتقال بانکی',
  online: 'آنلاین',
}

const typeLabels: Record<string, string> = {
  receipt: 'دریافت',
  payment: 'پرداخت',
}

export default function PaymentsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [page, setPage] = useState(0)
  const limit = 10

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['payments', page, search, typeFilter, methodFilter],
    queryFn: () =>
      paymentService.getPayments({
        skip: page * limit,
        limit,
        search: search || undefined,
        payment_type: typeFilter || undefined,
        payment_method: methodFilter || undefined,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => paymentService.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('پرداخت با موفقیت حذف شد')
      setIsDeleteOpen(false)
      setSelectedPayment(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'خطا در حذف پرداخت')
    },
  })

  const handleDelete = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsDeleteOpen(true)
  }

  const handleView = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsDetailOpen(true)
  }

  const handleCreate = () => {
    setSelectedPayment(null)
    setIsFormOpen(true)
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fa-IR').format(Math.round(price))

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fa-IR')

  if (isError) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <h2 className="text-red-800 font-bold mb-2">خطا در بارگذاری</h2>
        <button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ['payments'] })
          }
          className="mt-4 btn-primary"
        >
          تلاش مجدد
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مدیریت پرداخت‌ها</h1>
          <p className="text-gray-500 mt-1">
            {data ? `${data.total} پرداخت ثبت شده` : 'در حال بارگذاری...'}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlus className="w-5 h-5" />
          ثبت پرداخت جدید
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <HiOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در شماره فاکتور یا مرجع..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="input-field pr-10"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(0)
            }}
            className="input-field"
          >
            <option value="">همه انواع</option>
            <option value="receipt">دریافت</option>
            <option value="payment">پرداخت</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value)
              setPage(0)
            }}
            className="input-field"
          >
            <option value="">همه روش‌ها</option>
            <option value="cash">نقدی</option>
            <option value="card">کارت</option>
            <option value="check">چک</option>
            <option value="bank_transfer">انتقال بانکی</option>
            <option value="online">آنلاین</option>
          </select>

          <button
            onClick={() => {
              setSearch('')
              setTypeFilter('')
              setMethodFilter('')
              setPage(0)
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <HiOutlineX className="w-4 h-4" />
            پاک کردن فیلتر
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : data && data.payments.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                      شماره فاکتور
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                      مبلغ
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                      نوع
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                      روش
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                      شماره مرجع
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                      تاریخ
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.payments.map(
                    (payment) => (
                      console.log('Payment object:', payment),
                      (
                        <tr
                          key={payment.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* ✅ ستون شماره فاکتور - اصلاح شده */}
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleView(payment)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              {payment.invoice_number ||
                                `فاکتور #${payment.invoice_id}`}
                            </button>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <HiOutlineCurrencyDollar
                                className={`w-4 h-4 ${
                                  payment.payment_type === 'receipt'
                                    ? 'text-green-500'
                                    : 'text-red-500'
                                }`}
                              />
                              <span
                                className={`font-bold text-sm ${
                                  payment.payment_type === 'receipt'
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {formatPrice(payment.amount)} تومان
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                payment.payment_type === 'receipt'
                                  ? 'success'
                                  : 'danger'
                              }
                            >
                              {typeLabels[payment.payment_type]}
                            </Badge>
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-700">
                            {methodLabels[payment.payment_method] ||
                              payment.payment_method}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-600">
                            {payment.reference_number || '-'}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-700">
                            {payment.created_at
                              ? formatDate(payment.created_at)
                              : '-'}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleView(payment)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="مشاهده جزئیات"
                              >
                                <HiOutlineDocumentText className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(payment)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="حذف"
                              >
                                <HiOutlineTrash className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>

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
            title="پرداختی یافت نشد"
            description="هنوز پرداختی ثبت نشده یا با فیلترهای شما مطابقت ندارد"
          />
        )}
      </div>

      {/* Modals */}
      {isFormOpen && (
        <PaymentFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['payments'] })
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
            setIsFormOpen(false)
          }}
        />
      )}

      {isDetailOpen && selectedPayment && (
        <PaymentDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false)
            setSelectedPayment(null)
          }}
          payment={selectedPayment}
        />
      )}

      {isDeleteOpen && selectedPayment && (
        <ConfirmDialog
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false)
            setSelectedPayment(null)
          }}
          onConfirm={() => deleteMutation.mutate(selectedPayment.id)}
          title="حذف پرداخت"
          message={`آیا از حذف پرداخت ${formatPrice(selectedPayment.amount)} تومان اطمینان دارید؟ مانده فاکتور به‌روزرسانی خواهد شد.`}
          confirmText="حذف"
          cancelText="انصراف"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
