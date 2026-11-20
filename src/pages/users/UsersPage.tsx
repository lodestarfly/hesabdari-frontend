import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { 
  HiOutlinePlus, 
  HiOutlineSearch, 
  HiOutlinePencil, 
  HiOutlineTrash, 
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineRefresh
} from 'react-icons/hi'

import { userService } from '@/services/userService'
import { User, roleLabels, roleColors } from '@/types/user'
import { useAuthStore } from '@/store/authStore'

import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'

type UserFormModalProps = {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSuccess: () => void
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const limit = 10
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isToggleConfirmOpen, setIsToggleConfirmOpen] = useState(false)
  const [userToToggle, setUserToToggle] = useState<User | null>(null)

  // Fetch Users
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', page, search, roleFilter, statusFilter],
    queryFn: () => userService.getUsers({
      skip: page * limit,
      limit,
      search: search || undefined,
      role: roleFilter || undefined,
      is_active: statusFilter ? statusFilter === 'active' : undefined,
    }),
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('کاربر با موفقیت حذف شد')
      setIsConfirmOpen(false)
      setUserToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'خطا در حذف کاربر')
    },
  })

  // Toggle Status Mutation
  const toggleMutation = useMutation({
    mutationFn: (id: number) => userService.toggleUserStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('وضعیت کاربر تغییر کرد')
      setIsToggleConfirmOpen(false)
      setUserToToggle(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'خطا در تغییر وضعیت')
    },
  })

  const handleDelete = (user: User) => {
    setUserToDelete(user)
    setIsConfirmOpen(true)
  }

  const handleToggle = (user: User) => {
    setUserToToggle(user)
    setIsToggleConfirmOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsFormModalOpen(true)
  }

  const handleCreate = () => {
    setEditingUser(null)
    setIsFormModalOpen(true)
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مدیریت کاربران</h1>
          <p className="text-gray-500 mt-1">
            {data ? `${data.total} کاربر ثبت شده` : 'در حال بارگذاری...'}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlus className="w-5 h-5" />
          کاربر جدید
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <HiOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در نام، نام کاربری، ایمیل..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="input-field pr-10"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(0)
            }}
            className="input-field"
          >
            <option value="">همه نقش‌ها</option>
            <option value="admin">مدیر سیستم</option>
            <option value="manager">مدیر</option>
            <option value="sales">فروشنده</option>
            <option value="warehouse">انباردار</option>
            <option value="accountant">حسابدار</option>
            <option value="viewer">فقط مشاهده</option>
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
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : data && data.users.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">ردیف</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">نام کاربری</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">نام کامل</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">نقش</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">وضعیت</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">آخرین ورود</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {page * limit + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            {user.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{user.username}</p>
                            {user.email && (
                              <p className="text-xs text-gray-500">{user.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.full_name}</td>
                      <td className="px-6 py-4">
                        <Badge variant={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={user.is_active ? 'success' : 'danger'}>
                          {user.is_active ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString('fa-IR')
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="ویرایش"
                          >
                            <HiOutlinePencil className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => handleToggle(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.is_active 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={user.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                          >
                            {user.is_active ? (
                              <HiOutlineLockClosed className="w-5 h-5" />
                            ) : (
                              <HiOutlineLockOpen className="w-5 h-5" />
                            )}
                          </button>

                          {user.id !== currentUser?.id && !user.is_superuser && (
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <HiOutlineTrash className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    قبلی
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    بعدی
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="کاربری یافت نشد"
            description="هنوز کاربری ثبت نشده یا با فیلترهای شما مطابقت ندارد"
          />
        )}
      </div>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingUser(null)
        }}
        user={editingUser}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['users'] })
          setIsFormModalOpen(false)
          setEditingUser(null)
        }}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setUserToDelete(null)
        }}
        onConfirm={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
        title="حذف کاربر"
        message={`آیا از حذف کاربر "${userToDelete?.full_name}" اطمینان دارید؟ این عمل قابل بازگشت نیست.`}
        confirmText="حذف"
        cancelText="انصراف"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Toggle Status Confirm Dialog */}
      <ConfirmDialog
        isOpen={isToggleConfirmOpen}
        onClose={() => {
          setIsToggleConfirmOpen(false)
          setUserToToggle(null)
        }}
        onConfirm={() => userToToggle && toggleMutation.mutate(userToToggle.id)}
        title={userToToggle?.is_active ? 'غیرفعال کردن کاربر' : 'فعال کردن کاربر'}
        message={`آیا از ${userToToggle?.is_active ? 'غیرفعال کردن' : 'فعال کردن'} کاربر "${userToToggle?.full_name}" اطمینان دارید؟`}
        confirmText="تایید"
        cancelText="انصراف"
        variant="warning"
        isLoading={toggleMutation.isPending}
      />
    </div>
  )
}

function UserFormModal({ isOpen, onClose, user, onSuccess }: UserFormModalProps) {
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'viewer',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setForm({
      username: user?.username ?? '',
      full_name: user?.full_name ?? '',
      email: user?.email ?? '',
      password: '',
      role: user?.role ?? 'viewer',
    })
  }, [user, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const payload = {
        username: form.username,
        full_name: form.full_name,
        email: form.email || undefined,
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      }
      const service = userService as any
      if (user) {
        await service.updateUser(user.id, payload)
      } else {
        await service.createUser(payload)
      }
      toast.success(user ? 'کاربر با موفقیت ویرایش شد' : 'کاربر با موفقیت ایجاد شد')
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در ذخیره کاربر')
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass = 'input-field w-full'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="user-form-title">
        <h2 id="user-form-title" className="mb-5 text-xl font-bold text-gray-800">
          {user ? 'ویرایش کاربر' : 'کاربر جدید'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            نام کاربری
            <input className={inputClass} value={form.username} required onChange={e => setForm({ ...form, username: e.target.value })} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            نام کامل
            <input className={inputClass} value={form.full_name} required onChange={e => setForm({ ...form, full_name: e.target.value })} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            ایمیل
            <input className={inputClass} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            {user ? 'رمز عبور جدید (اختیاری)' : 'رمز عبور'}
            <input className={inputClass} type="password" value={form.password} required={!user} onChange={e => setForm({ ...form, password: e.target.value })} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            نقش
            <select className={inputClass} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="admin">مدیر سیستم</option>
              <option value="manager">مدیر</option>
              <option value="sales">فروشنده</option>
              <option value="warehouse">انباردار</option>
              <option value="accountant">حسابدار</option>
              <option value="viewer">فقط مشاهده</option>
            </select>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2" disabled={isSaving}>انصراف</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'در حال ذخیره...' : 'ذخیره'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}