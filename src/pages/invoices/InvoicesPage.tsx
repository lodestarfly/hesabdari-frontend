import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  HiOutlineCheck,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineX,
} from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'

import { invoiceService } from '@/services/invoiceService'
import {
  Invoice,
  invoiceStatusColors,
  invoiceStatusLabels,
  invoiceTypeColors,
  invoiceTypeLabels,
} from '@/types/invoice'
import { printInvoiceFull } from '@/utils/invoicePrint'

import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { customerService } from '@/services/customerService'
import { supplierService } from '@/services/supplierService'
import InvoiceFormModal from './InvoiceFormModal'
import PaymentModal from './PaymentModal'

export default function InvoicesPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const limit = 10

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [invoiceToAction, setInvoiceToAction] = useState<Invoice | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['invoices', page, search, typeFilter, statusFilter],
    queryFn: () =>
      invoiceService.getInvoices({
        skip: page * limit,
        limit,
        search: search || undefined,
        invoice_type: typeFilter || undefined,
        status: statusFilter || undefined,
      }),
    retry: 1,
  })

  const { data: customersDD } = useQuery({
    queryKey: ['customers', 'dropdown'],
    queryFn: () => customerService.getDropdown(),
  })
  const { data: suppliersDD } = useQuery({
    queryKey: ['suppliers', 'dropdown'],
    queryFn: () => supplierService.getDropdown(),
  })

  const partyName = (invoice: Invoice) => {
    if (invoice.invoice_type === 'purchase') {
      return (
        suppliersDD?.find((s: any) => s.id === invoice.supplier_id)?.name || '—'
      )
    }
    return (
      customersDD?.find((c: any) => c.id === invoice.customer_id)?.name || '—'
    )
  }

  const convertMutation = useMutation({
    mutationFn: (id: number) => invoiceService.convertProformaToInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('پیش‌فاکتور به فاکتور تبدیل شد')
      setIsConfirmOpen(false)
      setInvoiceToAction(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'خطا در تبدیل')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      invoiceService.cancelInvoice(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('فاکتور لغو شد')
      setIsCancelOpen(false)
      setInvoiceToAction(null)
      setCancelReason('')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'خطا در لغو')
    },
  })

  const handleConvert = (invoice: Invoice) => {
    setInvoiceToAction(invoice)
    setIsConfirmOpen(true)
  }

  const handleCancel = (invoice: Invoice) => {
    setInvoiceToAction(invoice)
    setIsCancelOpen(true)
  }

  const handlePayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsPaymentModalOpen(true)
  }

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setIsFormModalOpen(true)
  }

  const handleCreate = () => {
    setEditingInvoice(null)
    setIsFormModalOpen(true)
  }

  const handlePrintPdf = async (invoice: Invoice) => {
    try {
      const ok = await printInvoiceFull(invoice)
      if (!ok) {
        toast.error('مرورگر پنجره چاپ را مسدود کرد؛ لطفاً Popup را فعال کنید')
      }
    } catch {
      toast.error('خطا در آماده‌سازی چاپ فاکتور')
    }
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fa-IR').format(price || 0)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fa-IR')

  const invoices = data?.invoices || []

  if (isError) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <h2 className="text-red-800 font-bold mb-2">خطا در بارگذاری داده‌ها</h2>
        <p className="text-red-600 text-sm">
          {error instanceof Error ? error.message : 'خطای ناشناخته'}
        </p>
        <button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">مدیریت فاکتورها</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {data ? `${data.total} فاکتور ثبت شده` : 'در حال بارگذاری...'}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlus className="w-5 h-5" />
          فاکتور جدید
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <HiOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در شماره فاکتور..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="input-field pr-9"
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
            <option value="sale">فروش</option>
            <option value="purchase">خرید</option>
            <option value="proforma">پیش‌فاکتور</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(0)
            }}
            className="input-field"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="draft">پیش‌نویس</option>
            <option value="confirmed">تایید شده</option>
            <option value="paid">پرداخت شده</option>
            <option value="cancelled">لغو شده</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : invoices.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">
                      شماره فاکتور
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">
                      نوع
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">
                      طرف حساب
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">
                      تاریخ
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">
                      مبلغ کل
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">
                      مانده
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">
                      وضعیت
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((invoice) => {
                    const remaining = invoice.remaining_amount || 0
                    const isFullyPaid = remaining <= 0
                    return (
                      <tr
                        key={invoice.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* شماره فاکتور */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() =>
                                navigate(`/invoices/${invoice.id}`)
                              }
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm text-right"
                            >
                              {invoice.invoice_number}
                            </button>
                            {invoice.is_official && (
                              <Badge variant="info" size="sm">
                                رسمی
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* نوع */}
                        <td className="px-4 py-3">
                          <Badge
                            variant={invoiceTypeColors[invoice.invoice_type]}
                          >
                            {invoiceTypeLabels[invoice.invoice_type]}
                          </Badge>
                        </td>

                        {/* طرف حساب */}
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-[150px]">
                          <p className="truncate" title={partyName(invoice)}>
                            {partyName(invoice)}
                          </p>
                        </td>

                        {/* تاریخ */}
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {formatDate(invoice.issue_date)}
                        </td>

                        {/* مبلغ کل */}
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-800 text-sm">
                            {formatPrice(invoice.total_amount)}
                            <span className="text-xs font-normal text-gray-500 mr-1">
                              تومان
                            </span>
                          </p>
                        </td>

                        {/* مانده */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <HiOutlineCurrencyDollar
                              className={`w-4 h-4 shrink-0 ${
                                isFullyPaid ? 'text-green-500' : 'text-red-500'
                              }`}
                            />
                            <span
                              className={`font-medium text-sm ${
                                isFullyPaid ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {formatPrice(remaining)}
                            </span>
                          </div>
                        </td>

                        {/* وضعیت */}
                        <td className="px-4 py-3">
                          <Badge variant={invoiceStatusColors[invoice.status]}>
                            {invoiceStatusLabels[invoice.status]}
                          </Badge>
                        </td>

                        {/* عملیات */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {/* چاپ / PDF */}
                            <button
                              onClick={() => handlePrintPdf(invoice)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="چاپ / PDF"
                            >
                              <HiOutlineDocumentText className="w-4 h-4" />
                            </button>

                            {/* ویرایش (فقط پیش‌نویس) */}
                            {invoice.status === 'draft' && (
                              <button
                                onClick={() => handleEdit(invoice)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="ویرایش"
                              >
                                <HiOutlinePencil className="w-4 h-4" />
                              </button>
                            )}

                            {/* تبدیل پیش‌فاکتور */}
                            {invoice.invoice_type === 'proforma' &&
                              invoice.status === 'draft' && (
                                <button
                                  onClick={() => handleConvert(invoice)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="تبدیل به فاکتور"
                                >
                                  <HiOutlineCheck className="w-4 h-4" />
                                </button>
                              )}

                            {/* ثبت پرداخت */}
                            {invoice.status === 'confirmed' && !isFullyPaid && (
                              <button
                                onClick={() => handlePayment(invoice)}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="ثبت پرداخت"
                              >
                                <HiOutlineCurrencyDollar className="w-4 h-4" />
                              </button>
                            )}

                            {/* لغو فاکتور */}
                            {invoice.status === 'confirmed' && (
                              <button
                                onClick={() => handleCancel(invoice)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="لغو فاکتور"
                              >
                                <HiOutlineX className="w-4 h-4" />
                              </button>
                            )}
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
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  صفحه {page + 1} از {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    قبلی
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    بعدی
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="فاکتوری یافت نشد"
            description="هنوز فاکتوری ثبت نشده یا با فیلترهای شما مطابقت ندارد"
          />
        )}
      </div>

      {/* Invoice Form Modal */}
      {isFormModalOpen && (
        <InvoiceFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false)
            setEditingInvoice(null)
          }}
          invoice={editingInvoice}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
            setIsFormModalOpen(false)
            setEditingInvoice(null)
          }}
        />
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedInvoice && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setSelectedInvoice(null)
          }}
          invoice={selectedInvoice}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
            setIsPaymentModalOpen(false)
            setSelectedInvoice(null)
          }}
        />
      )}

      {/* Convert Confirm Dialog */}
      {isConfirmOpen && invoiceToAction && (
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => {
            setIsConfirmOpen(false)
            setInvoiceToAction(null)
          }}
          onConfirm={() => convertMutation.mutate(invoiceToAction.id)}
          title="تبدیل پیش‌فاکتور"
          message={`آیا از تبدیل پیش‌فاکتور "${invoiceToAction.invoice_number}" به فاکتور فروش اطمینان دارید؟`}
          confirmText="تبدیل"
          cancelText="انصراف"
          variant="info"
          isLoading={convertMutation.isPending}
        />
      )}

      {/* Cancel Dialog */}
      {isCancelOpen && invoiceToAction && (
        <Modal
          isOpen={isCancelOpen}
          onClose={() => {
            setIsCancelOpen(false)
            setInvoiceToAction(null)
            setCancelReason('')
          }}
          title="لغو فاکتور"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="text-sm font-bold text-yellow-800 mb-1">
                ⚠️ توجه
              </h4>
              <p className="text-xs text-yellow-700">
                با لغو فاکتور، موجودی انبار به حالت قبل برمی‌گردد و این عمل قابل
                بازگشت نیست.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                دلیل لغو *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder="دلیل لغو فاکتور را وارد کنید..."
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setIsCancelOpen(false)
                  setInvoiceToAction(null)
                  setCancelReason('')
                }}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  if (cancelReason.trim().length >= 5) {
                    cancelMutation.mutate({
                      id: invoiceToAction.id,
                      reason: cancelReason,
                    })
                  } else {
                    toast.error('دلیل لغو باید حداقل 5 کاراکتر باشد')
                  }
                }}
                disabled={
                  cancelMutation.isPending || cancelReason.trim().length < 5
                }
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
              >
                {cancelMutation.isPending ? 'در حال لغو...' : 'لغو فاکتور'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
