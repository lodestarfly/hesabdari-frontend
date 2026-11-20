import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  HiOutlineCog,
  HiOutlineDocumentText,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineLockClosed,
  HiOutlineSave,
  HiOutlineUser,
} from 'react-icons/hi'
import { z } from 'zod'

import AuditLogsTab from '@/components/settings/AuditLogsTab'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import TabButton from '@/components/ui/TabButton'
import { settingsService } from '@/services/settingsService'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'

// ==================== System Settings Tab ====================
function SystemSettingsTab() {
  const settings = useSettingsStore()
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) {
      toast.error('حجم لوگو باید کمتر از 500 کیلوبایت باشد')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = String(reader.result)
      setLogoPreview(base64)
      settings.setLogo(base64)
      toast.success('لوگو با موفقیت ذخیره شد')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    settings.setLogo(null)
    toast.success('لوگو حذف شد')
  }

  return (
    <div className="card max-w-2xl space-y-6">
      <h3 className="text-lg font-bold text-gray-800">تنظیمات شرکت</h3>

      {/* لوگو */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          لوگو شرکت
        </label>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="لوگو"
              className="w-20 h-20 rounded-xl object-cover border border-gray-200 bg-white"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
              بدون لوگو
            </div>
          )}
          <div className="space-y-2">
            <label className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium cursor-pointer">
              انتخاب تصویر لوگو
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </label>
            {logoPreview && (
              <button
                onClick={handleRemoveLogo}
                className="block px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                حذف لوگو
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          فرمت PNG/JPG — حداکثر 500 کیلوبایت — در هدر پنل و فاکتورهای چاپی نمایش
          داده می‌شود
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نام شرکت / سازمان
          </label>
          <input
            className="input-field"
            value={settings.companyName}
            onChange={(e) => settings.setCompanyName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            تلفن تماس
          </label>
          <input
            className="input-field"
            value={settings.phone}
            onChange={(e) => settings.setPhone(e.target.value)}
            placeholder="021-12345678"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ایمیل
          </label>
          <input
            className="input-field"
            value={settings.email}
            onChange={(e) => settings.setEmail(e.target.value)}
            placeholder="info@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نرخ مالیات پیش‌فرض (%)
          </label>
          <input
            type="number"
            className="input-field"
            value={settings.taxPercent}
            onChange={(e) => settings.setTaxPercent(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          آدرس
        </label>
        <textarea
          rows={2}
          className="input-field resize-none"
          value={settings.address}
          onChange={(e) => settings.setAddress(e.target.value)}
        />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
        ✅ تغییرات به‌صورت خودکار ذخیره می‌شوند و در هدر پنل و فاکتورهای چاپی
        اعمال خواهند شد.
      </div>
    </div>
  )
}

// ==================== Types & Schemas ====================
type SettingsTab = 'profile' | 'password' | 'system' | 'logs'

const profileSchema = z.object({
  full_name: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر نیست').optional().or(z.literal('')),
  phone: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    current_password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
    new_password: z.string().min(6, 'رمز جدید باید حداقل 6 کاراکتر باشد'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'رمزهای عبور مطابقت ندارند',
    path: ['confirm_password'],
  })

type PasswordFormData = z.infer<typeof passwordSchema>

// ==================== Helper ====================
/** تبدیل خطای API به رشته قابل نمایش */
function getErrorMessage(err: any): string {
  if (!err?.response?.data) return 'خطای ناشناخته'

  const detail = err.response.data.detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    return detail
      .map((e: any) => {
        const field = e.loc?.slice(1).join('.') || ''
        const msg = e.msg || ''
        return field ? `${field}: ${msg}` : msg
      })
      .join(' | ')
  }

  if (typeof detail === 'object') {
    return JSON.stringify(detail)
  }

  return 'خطا در عملیات'
}

// ==================== Main Component ====================
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const tabs = [
    {
      id: 'profile' as const,
      label: 'پروفایل کاربری',
      icon: <HiOutlineUser className="w-4 h-4" />,
    },
    {
      id: 'password' as const,
      label: 'تغییر رمز عبور',
      icon: <HiOutlineLockClosed className="w-4 h-4" />,
    },
    {
      id: 'system' as const,
      label: 'تنظیمات سیستم',
      icon: <HiOutlineCog className="w-4 h-4" />,
    },
    {
      id: 'logs' as const,
      label: 'لاگ‌های سیستم',
      icon: <HiOutlineDocumentText className="w-4 h-4" />,
    },
  ]

  // Fetch Profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: settingsService.getProfile,
  })

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      settingsService.updateProfile({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
      }),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile'], updatedProfile)
      // ✅ به‌روزرسانی مستقیم store با setState
      useAuthStore.setState((state) => ({
        ...state,
        user: state.user
          ? { ...state.user, full_name: updatedProfile.full_name }
          : state.user,
      }))
      toast.success('پروفایل با موفقیت به‌روز شد')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordFormData) =>
      settingsService.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      }),
    onSuccess: () => {
      toast.success('رمز عبور با موفقیت تغییر کرد')
      passwordForm.reset()
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })

  // Profile Form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    },
  })

  // Password Form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data)
  }

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data)
  }

  if (profileLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">تنظیمات</h1>
        <p className="text-gray-500 mt-1 text-sm">
          مدیریت حساب کاربری و تنظیمات سیستم
        </p>
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              icon={tab.icon}
              label={tab.label}
            />
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card max-w-2xl">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            اطلاعات کاربری
          </h3>
          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام کاربری
              </label>
              <input
                type="text"
                value={profile?.username || ''}
                disabled
                className="input-field bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                نام کاربری قابل تغییر نیست
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام و نام خانوادگی *
              </label>
              <input
                {...profileForm.register('full_name')}
                className="input-field"
                placeholder="نام و نام خانوادگی"
              />
              {profileForm.formState.errors.full_name && (
                <p className="mt-1 text-sm text-red-500">
                  {profileForm.formState.errors.full_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ایمیل
              </label>
              <input
                {...profileForm.register('email')}
                type="email"
                className="input-field"
                placeholder="example@email.com"
              />
              {profileForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {profileForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تلفن
              </label>
              <input
                {...profileForm.register('phone')}
                className="input-field"
                placeholder="09123456789"
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <HiOutlineSave className="w-5 h-5" />
                {updateProfileMutation.isPending
                  ? 'در حال ذخیره...'
                  : 'ذخیره تغییرات'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card max-w-2xl">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            تغییر رمز عبور
          </h3>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رمز عبور فعلی *
              </label>
              <div className="relative">
                <input
                  {...passwordForm.register('current_password')}
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="input-field pl-10"
                  placeholder="رمز عبور فعلی"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? (
                    <HiOutlineEyeOff className="w-5 h-5" />
                  ) : (
                    <HiOutlineEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passwordForm.formState.errors.current_password && (
                <p className="mt-1 text-sm text-red-500">
                  {passwordForm.formState.errors.current_password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رمز عبور جدید *
              </label>
              <div className="relative">
                <input
                  {...passwordForm.register('new_password')}
                  type={showNewPassword ? 'text' : 'password'}
                  className="input-field pl-10"
                  placeholder="رمز عبور جدید"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? (
                    <HiOutlineEyeOff className="w-5 h-5" />
                  ) : (
                    <HiOutlineEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passwordForm.formState.errors.new_password && (
                <p className="mt-1 text-sm text-red-500">
                  {passwordForm.formState.errors.new_password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تکرار رمز عبور جدید *
              </label>
              <div className="relative">
                <input
                  {...passwordForm.register('confirm_password')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input-field pl-10"
                  placeholder="تکرار رمز عبور جدید"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <HiOutlineEyeOff className="w-5 h-5" />
                  ) : (
                    <HiOutlineEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passwordForm.formState.errors.confirm_password && (
                <p className="mt-1 text-sm text-red-500">
                  {passwordForm.formState.errors.confirm_password.message}
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-bold text-blue-800 mb-1">
                💡 نکات امنیتی
              </h4>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>رمز عبور باید حداقل 6 کاراکتر باشد</li>
                <li>از ترکیب حروف بزرگ، کوچک، اعداد و نمادها استفاده کنید</li>
                <li>رمز عبور را به صورت دوره‌ای تغییر دهید</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <HiOutlineLockClosed className="w-5 h-5" />
                {changePasswordMutation.isPending
                  ? 'در حال تغییر...'
                  : 'تغییر رمز عبور'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'system' && <SystemSettingsTab />}

      {/* Logs Tab */}
      {activeTab === 'logs' && <AuditLogsTab />}
    </div>
  )
}
