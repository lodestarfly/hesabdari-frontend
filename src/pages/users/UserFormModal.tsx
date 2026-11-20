import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineLockClosed } from 'react-icons/hi'

import Modal from '@/components/ui/Modal'
import { userService } from '@/services/userService'
import { User, UserCreate, UserUpdate, roleLabels } from '@/types/user'

const createSchema = z.object({
  username: z.string().min(3, 'نام کاربری باید حداقل 3 کاراکتر باشد')
    .regex(/^[a-zA-Z0-9_]+$/, 'فقط حروف انگلیسی، اعداد و _ مجاز است'),
  full_name: z.string().min(2, 'نام کامل باید حداقل 2 کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر نیست').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'sales', 'warehouse', 'accountant', 'viewer']),
  password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
})

const updateSchema = z.object({
  full_name: z.string().min(2, 'نام کامل باید حداقل 2 کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر نیست').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'sales', 'warehouse', 'accountant', 'viewer']),
  is_active: z.boolean(),
})

type CreateFormData = z.infer<typeof createSchema>
type UpdateFormData = z.infer<typeof updateSchema>

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSuccess: () => void
}

export default function UserFormModal({ isOpen, onClose, user, onSuccess }: UserFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!user

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      role: 'viewer',
    },
  })

  const updateForm = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
  })

  useEffect(() => {
    if (user && isOpen) {
      updateForm.reset({
        full_name: user.full_name,
        email: user.email || '',
        phone: user.phone || '',
        role: user.role,
        is_active: user.is_active,
      })
    }
  }, [user, isOpen, updateForm])

  const onCreateSubmit = async (data: CreateFormData) => {
    setIsLoading(true)
    try {
      await userService.createUser(data)
      toast.success('کاربر جدید با موفقیت ایجاد شد')
      onSuccess()
      createForm.reset()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در ایجاد کاربر')
    } finally {
      setIsLoading(false)
    }
  }

  const onUpdateSubmit = async (data: UpdateFormData) => {
    if (!user) return
    setIsLoading(true)
    try {
      await userService.updateUser(user.id, data)
      toast.success('اطلاعات کاربر با موفقیت به‌روز شد')
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در به‌روزرسانی')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'ویرایش کاربر' : 'ایجاد کاربر جدید'}
      size="md"
    >
      {isEditing ? (
        <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نام کامل *
            </label>
            <input
              {...updateForm.register('full_name')}
              className="input-field"
            />
            {updateForm.formState.errors.full_name && (
              <p className="mt-1 text-sm text-red-500">
                {updateForm.formState.errors.full_name.message}
              </p>
            )}
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ایمیل
              </label>
              <div className="relative">
                <HiOutlineMail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...updateForm.register('email')}
                  type="email"
                  className="input-field pr-10"
                />
              </div>
              {updateForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {updateForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تلفن
              </label>
              <div className="relative">
                <HiOutlinePhone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...updateForm.register('phone')}
                  className="input-field pr-10"
                />
              </div>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نقش کاربری *
            </label>
            <select
              {...updateForm.register('role')}
              className="input-field"
            >
              {Object.entries(roleLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="is_active"
              {...updateForm.register('is_active')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
              کاربر فعال است
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 btn-primary py-3 disabled:opacity-50"
            >
              {isLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نام کاربری *
            </label>
            <div className="relative">
              <HiOutlineUser className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...createForm.register('username')}
                className="input-field pr-10"
                placeholder="فقط حروف انگلیسی، اعداد و _"
              />
            </div>
            {createForm.formState.errors.username && (
              <p className="mt-1 text-sm text-red-500">
                {createForm.formState.errors.username.message}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نام کامل *
            </label>
            <input
              {...createForm.register('full_name')}
              className="input-field"
            />
            {createForm.formState.errors.full_name && (
              <p className="mt-1 text-sm text-red-500">
                {createForm.formState.errors.full_name.message}
              </p>
            )}
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ایمیل
              </label>
              <div className="relative">
                <HiOutlineMail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...createForm.register('email')}
                  type="email"
                  className="input-field pr-10"
                />
              </div>
              {createForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {createForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تلفن
              </label>
              <div className="relative">
                <HiOutlinePhone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...createForm.register('phone')}
                  className="input-field pr-10"
                />
              </div>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نقش کاربری *
            </label>
            <select
              {...createForm.register('role')}
              className="input-field"
            >
              {Object.entries(roleLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رمز عبور *
            </label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...createForm.register('password')}
                type="password"
                className="input-field pr-10"
                placeholder="حداقل 6 کاراکتر"
              />
            </div>
            {createForm.formState.errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {createForm.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 btn-primary py-3 disabled:opacity-50"
            >
              {isLoading ? 'در حال ایجاد...' : 'ایجاد کاربر'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}