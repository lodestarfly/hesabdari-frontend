import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineEye,
  HiOutlineGlobe,
  HiOutlineLogin,
  HiOutlineLogout,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineUser,
  HiOutlineX,
} from 'react-icons/hi'

import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { AuditLog, auditService } from '@/services/auditService'

// برچسب‌های فارسی
const actionLabels: Record<string, string> = {
  create: 'ایجاد',
  update: 'ویرایش',
  delete: 'حذف',
  login: 'ورود',
  logout: 'خروج',
  view: 'مشاهده',
  export: 'خروجی',
  print: 'چاپ',
}

const tableLabels: Record<string, string> = {
  users: 'کاربران',
  customers: 'مشتریان',
  suppliers: 'تامین‌کنندگان',
  products: 'محصولات',
  invoices: 'فاکتورها',
  payments: 'پرداخت‌ها',
  categories: 'دسته‌بندی‌ها',
  settings: 'تنظیمات',
}

const actionIcons: Record<string, any> = {
  create: HiOutlinePlus,
  update: HiOutlinePencil,
  delete: HiOutlineTrash,
  login: HiOutlineLogin,
  logout: HiOutlineLogout,
  view: HiOutlineEye,
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  logout: 'bg-gray-100 text-gray-700',
  view: 'bg-yellow-100 text-yellow-700',
}

// تبدیل تاریخ میلادی به شمسی
const toJalali = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AuditLogsTab() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [page, setPage] = useState(0)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search, actionFilter, tableFilter],
    queryFn: () =>
      auditService.getAuditLogs({
        skip: page * limit,
        limit,
        search: search || undefined,
        action: actionFilter || undefined,
        table_name: tableFilter || undefined,
      }),
  })

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  return (
    <div className="space-y-4">
      {/* آمار */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">کل لاگ‌ها</p>
          <p className="text-2xl font-bold text-gray-800">{data?.total || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">ایجاد</p>
          <p className="text-2xl font-bold text-green-600">
            {data?.logs?.filter((l) => l.action === 'create').length || 0}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">ویرایش</p>
          <p className="text-2xl font-bold text-blue-600">
            {data?.logs?.filter((l) => l.action === 'update').length || 0}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">حذف</p>
          <p className="text-2xl font-bold text-red-600">
            {data?.logs?.filter((l) => l.action === 'delete').length || 0}
          </p>
        </div>
      </div>

      {/* فیلترها */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <HiOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در لاگ‌ها..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="input-field pr-10 w-full"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(0)
            }}
            className="input-field"
          >
            <option value="">همه عملیات‌ها</option>
            {Object.entries(actionLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={tableFilter}
            onChange={(e) => {
              setTableFilter(e.target.value)
              setPage(0)
            }}
            className="input-field"
          >
            <option value="">همه جداول</option>
            {Object.entries(tableLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {(search || actionFilter || tableFilter) && (
          <button
            onClick={() => {
              setSearch('')
              setActionFilter('')
              setTableFilter('')
              setPage(0)
            }}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <HiOutlineX className="w-4 h-4" />
            پاک کردن فیلترها
          </button>
        )}
      </div>

      {/* جدول لاگ‌ها */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : data && data.logs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">
                      عملیات
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">
                      جدول
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">
                      کاربر
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">
                      IP
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">
                      تاریخ
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">
                      جزئیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.logs.map((log) => {
                    const Icon =
                      actionIcons[log.action] || HiOutlineDocumentText
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {actionLabels[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {tableLabels[log.table_name || ''] ||
                            log.table_name ||
                            '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <HiOutlineUser className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {log.username || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <HiOutlineGlobe className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 font-mono">
                              {log.ip_address || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <HiOutlineClock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {toJalali(log.created_at)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            مشاهده
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  صفحه {page + 1} از {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    قبلی
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    بعدی
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="لاگی یافت نشد"
            description="هنوز لاگی ثبت نشده یا با فیلترهای شما مطابقت ندارد"
          />
        )}
      </div>

      {/* مودال جزئیات */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="جزئیات لاگ"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">عملیات</p>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${actionColors[selectedLog.action] || 'bg-gray-100 text-gray-700'}`}
                >
                  {actionLabels[selectedLog.action] || selectedLog.action}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">جدول</p>
                <p className="text-sm font-medium text-gray-800">
                  {tableLabels[selectedLog.table_name || ''] ||
                    selectedLog.table_name ||
                    '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">کاربر</p>
                <p className="text-sm font-medium text-gray-800">
                  {selectedLog.username || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">شناسه رکورد</p>
                <p className="text-sm font-medium text-gray-800">
                  {selectedLog.record_id || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">IP</p>
                <p className="text-sm font-mono text-gray-800">
                  {selectedLog.ip_address || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">تاریخ</p>
                <p className="text-sm font-medium text-gray-800">
                  {toJalali(selectedLog.created_at)}
                </p>
              </div>
            </div>

            {selectedLog.old_values && (
              <div>
                <p className="text-xs text-gray-500 mb-2">مقادیر قبلی</p>
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-x-auto max-h-40">
                  {JSON.stringify(JSON.parse(selectedLog.old_values), null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.new_values && (
              <div>
                <p className="text-xs text-gray-500 mb-2">مقادیر جدید</p>
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-x-auto max-h-40">
                  {JSON.stringify(JSON.parse(selectedLog.new_values), null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
