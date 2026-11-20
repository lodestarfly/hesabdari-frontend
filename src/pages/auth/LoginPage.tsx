import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(3, 'نام کاربری باید حداقل 3 کاراکتر باشد'),
  password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const response = await authService.login(data)
      setAuth(
        {
          ...response.user,
          is_active: true,
          is_superuser: false,
        },
        response.access_token
      )
      toast.success('ورود موفقیت‌آمیز بود')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در ورود')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">ورود به سیستم</h2>
        <p className="text-sm text-gray-500">لطفاً اطلاعات خود را وارد کنید</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Username Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نام کاربری
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <HiOutlineUser className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('username')}
              type="text"
              className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl
                         focus:border-blue-500 focus:ring-0
                         transition-all duration-200
                         placeholder:text-gray-400"
              placeholder="نام کاربری خود را وارد کنید"
            />
          </div>
          {errors.username && (
            <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
              <span>⚠️</span>
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رمز عبور
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('password')}
              type="password"
              className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl
                         focus:border-blue-500 focus:ring-0
                         transition-all duration-200
                         placeholder:text-gray-400"
              placeholder="رمز عبور خود را وارد کنید"
            />
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
              <span>⚠️</span>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">مرا به خاطر بسپار</span>
          </label>
          <a
            href="#"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            فراموشی رمز عبور؟
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700
                     text-white py-3 rounded-xl font-medium
                     hover:from-blue-700 hover:to-blue-800
                     focus:outline-none focus:ring-4 focus:ring-blue-500/30
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 shadow-lg"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              در حال ورود...
            </span>
          ) : (
            'ورود به سیستم'
          )}
        </button>
      </form>

      {/* Register Link */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-center text-sm text-gray-600">
          حساب کاربری ندارید؟{' '}
          <a
            href="/register"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ثبت‌نام کنید
          </a>
        </p>
      </div>
    </div>
  )
}
