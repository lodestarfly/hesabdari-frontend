import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineLockClosed } from 'react-icons/hi'
import { authService } from '@/services/authService'

const registerSchema = z.object({
  username: z.string().min(3, 'نام کاربری باید حداقل 3 کاراکتر باشد')
    .regex(/^[a-zA-Z0-9_]+$/, 'فقط حروف انگلیسی، اعداد و _ مجاز است'),
  full_name: z.string().min(2, 'نام کامل باید حداقل 2 کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر نیست').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'sales', 'warehouse', 'accountant', 'viewer']),
  password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'viewer',
    },
  })
  
  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      await authService.register(data)
      toast.success('ثبت‌نام موفقیت‌آمیز بود')
      navigate('/login')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در ثبت‌نام')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          ثبت‌نام کاربر جدید
        </h2>
        <p className="text-sm text-gray-500">
          اطلاعات خود را برای ایجاد حساب وارد کنید
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نام کاربری *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <HiOutlineUser className="h-5 w-5 text-gray-400" />
            </div>
            <input {...register('username')} className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-all duration-200" />
          </div>
          {errors.username && (
            <p className="mt-2 text-sm text-red-500">⚠️ {errors.username.message}</p>
          )}
        </div>
        
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نام کامل *
          </label>
          <input {...register('full_name')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-all duration-200" />
          {errors.full_name && (
            <p className="mt-2 text-sm text-red-500">⚠️ {errors.full_name.message}</p>
          )}
        </div>
        
        {/* Email & Phone */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ایمیل
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <HiOutlineMail className="h-5 w-5 text-gray-400" />
              </div>
              <input {...register('email')} type="email" className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-all duration-200" />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-500">⚠️ {errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تلفن
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <HiOutlinePhone className="h-5 w-5 text-gray-400" />
              </div>
              <input {...register('phone')} className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-all duration-200" />
            </div>
          </div>
        </div>
        
        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نقش کاربری *
          </label>
          <select {...register('role')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-all duration-200 bg-white">
            <option value="admin">مدیر سیستم</option>
            <option value="manager">مدیر</option>
            <option value="sales">فروشنده</option>
            <option value="warehouse">انباردار</option>
            <option value="accountant">حسابدار</option>
            <option value="viewer">فقط مشاهده</option>
          </select>
        </div>
        
        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رمز عبور *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
            </div>
            <input {...register('password')} type="password" className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-all duration-200" />
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-500">⚠️ {errors.password.message}</p>
          )}
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
          {isLoading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
        </button>
      </form>
      
      {/* Login Link */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-center text-sm text-gray-600">
          قبلاً ثبت‌نام کرده‌اید؟{' '}
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            وارد شوید
          </a>
        </p>
      </div>
    </div>
  )
}