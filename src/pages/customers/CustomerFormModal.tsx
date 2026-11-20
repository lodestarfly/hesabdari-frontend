import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineCreditCard } from 'react-icons/hi'

import Modal from '@/components/ui/Modal'
import { customerService } from '@/services/customerService'
import { Customer, CustomerCreate, CustomerUpdate, CustomerType, customerTypeLabels } from '@/types/customer'

const createSchema = z.object({
  customer_type: z.enum(['real', 'legal']),
  name: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد'),
  national_code: z.string().optional(),
  economic_code: z.string().optional(),
  registration_no: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email('ایمیل معتبر نیست').optional().or(z.literal('')),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  credit_limit: z.number().min(0, 'سقف اعتبار نمی‌تواند منفی باشد'),
  payment_terms: z.number().min(0, 'روزهای پرداخت نمی‌تواند منفی باشد'),
  bank_card_number: z.string().optional(),
  bank_account: z.string().optional(),
  iban: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean(),
})

type FormData = z.infer<typeof createSchema>

interface CustomerFormModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
  onSuccess: () => void
}

export default function CustomerFormModal({ isOpen, onClose, customer, onSuccess }: CustomerFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'financial' | 'bank'>('info')
  const isEditing = !!customer

  const form = useForm<FormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      customer_type: 'real',
      credit_limit: 0,
      payment_terms: 0,
      is_active: true,
    },
  })

  const customerType = form.watch('customer_type')

  useEffect(() => {
    if (customer && isOpen) {
      form.reset({
        customer_type: customer.customer_type,
        name: customer.name,
        national_code: customer.national_code || '',
        economic_code: customer.economic_code || '',
        registration_no: customer.registration_no || '',
        phone: customer.phone || '',
        mobile: customer.mobile || '',
        email: customer.email || '',
        address: customer.address || '',
        postal_code: customer.postal_code || '',
        credit_limit: customer.credit_limit,
        payment_terms: customer.payment_terms,
        bank_card_number: customer.bank_card_number || '',
        bank_account: customer.bank_account || '',
        iban: customer.iban || '',
        notes: customer.notes || '',
        is_active: customer.is_active,
      })
    } else {
      form.reset({
        customer_type: 'real',
        name: '',
        national_code: '',
        economic_code: '',
        registration_no: '',
        phone: '',
        mobile: '',
        email: '',
        address: '',
        postal_code: '',
        credit_limit: 0,
        payment_terms: 0,
        bank_card_number: '',
        bank_account: '',
        iban: '',
        notes: '',
        is_active: true,
      })
    }
    setActiveTab('info')
  }, [customer, isOpen, form])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      if (isEditing && customer) {
        await customerService.updateCustomer(customer.id, data)
        toast.success('اطلاعات مشتری با موفقیت به‌روز شد')
      } else {
        await customerService.createCustomer(data)
        toast.success('مشتری جدید با موفقیت ایجاد شد')
      }
      onSuccess()
      form.reset()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در ذخیره مشتری')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'info' as const, label: 'اطلاعات اصلی', icon: HiOutlineUser },
    { id: 'financial' as const, label: 'مالی و اعتبار', icon: HiOutlineCreditCard },
    { id: 'bank' as const, label: 'اطلاعات بانکی', icon: HiOutlineCreditCard },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'ویرایش مشتری' : 'ایجاد مشتری جدید'}
      size="xl"
    >
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative ${
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Tab: Info */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            {/* Customer Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع مشتری *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  customerType === 'real' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    {...form.register('customer_type')}
                    value="real"
                    className="hidden"
                  />
                  <HiOutlineUser className="w-5 h-5" />
                  <span className="font-medium">حقیقی</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  customerType === 'legal' 
                    ? 'border-purple-500 bg-purple-50 text-purple-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    {...form.register('customer_type')}
                    value="legal"
                    className="hidden"
                  />
                  <HiOutlineUser className="w-5 h-5" />
                  <span className="font-medium">حقوقی (شرکت)</span>
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {customerType === 'legal' ? 'نام شرکت *' : 'نام و نام خانوادگی *'}
              </label>
              <input
                {...form.register('name')}
                className="input-field"
                placeholder={customerType === 'legal' ? 'نام شرکت یا سازمان' : 'نام کامل مشتری'}
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* National Code / Economic Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {customerType === 'legal' ? 'شناسه ملی' : 'کد ملی'}
                </label>
                <input
                  {...form.register('national_code')}
                  className="input-field"
                  placeholder={customerType === 'legal' ? '11 رقم' : '10 رقم'}
                />
              </div>

              {customerType === 'legal' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      کد اقتصادی
                    </label>
                    <input
                      {...form.register('economic_code')}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      شماره ثبت
                    </label>
                    <input
                      {...form.register('registration_no')}
                      className="input-field"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تلفن ثابت
                </label>
                <div className="relative">
                  <HiOutlinePhone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...form.register('phone')}
                    className="input-field pr-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  موبایل
                </label>
                <div className="relative">
                  <HiOutlinePhone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...form.register('mobile')}
                    className="input-field pr-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ایمیل
                </label>
                <div className="relative">
                  <HiOutlineMail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...form.register('email')}
                    type="email"
                    className="input-field pr-10"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  کد پستی
                </label>
                <input
                  {...form.register('postal_code')}
                  className="input-field"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                آدرس
              </label>
              <div className="relative">
                <HiOutlineLocationMarker className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  {...form.register('address')}
                  rows={2}
                  className="input-field pr-10 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Financial */}
        {activeTab === 'financial' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سقف اعتبار (تومان)
                </label>
                <input
                  type="number"
                  {...form.register('credit_limit', { valueAsNumber: true })}
                  className="input-field"
                  placeholder="0 = بدون محدودیت"
                />
                <p className="text-xs text-gray-500 mt-1">
                  حداکثر مبلغ بدهی مجاز مشتری
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  شرایط پرداخت (روز)
                </label>
                <input
                  type="number"
                  {...form.register('payment_terms', { valueAsNumber: true })}
                  className="input-field"
                  placeholder="0 = نقدی"
                />
                <p className="text-xs text-gray-500 mt-1">
                  تعداد روزهای اعتبار برای پرداخت
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-blue-800 mb-2">💡 راهنما</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• سقف اعتبار 0 به معنای بدون محدودیت است</li>
                <li>• شرایط پرداخت 0 به معنای پرداخت نقدی است</li>
                <li>• مانده حساب به صورت خودکار از فاکتورها محاسبه می‌شود</li>
              </ul>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                یادداشت‌ها
              </label>
              <textarea
                {...form.register('notes')}
                rows={3}
                className="input-field resize-none"
                placeholder="توضیحات اضافی درباره مشتری..."
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                id="is_active"
                {...form.register('is_active')}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                مشتری فعال است
              </label>
            </div>
          </div>
        )}

        {/* Tab: Bank */}
        {activeTab === 'bank' && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <h4 className="text-sm font-bold text-yellow-800 mb-1">🔒 اطلاعات محرمانه</h4>
              <p className="text-xs text-yellow-700">
                اطلاعات بانکی به صورت رمزنگاری شده در دیتابیس ذخیره می‌شوند و فقط کاربران مجاز می‌توانند آن‌ها را مشاهده کنند.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                شماره کارت بانکی
              </label>
              <div className="relative">
                <HiOutlineCreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...form.register('bank_card_number')}
                  className="input-field pr-10"
                  placeholder="16 رقم"
                  maxLength={19}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                شماره حساب
              </label>
              <input
                {...form.register('bank_account')}
                className="input-field"
                placeholder="شماره حساب بانکی"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                شماره شبا (IBAN)
              </label>
              <input
                {...form.register('iban')}
                className="input-field"
                placeholder="IR00 0000 0000 0000 0000 0000 00"
                maxLength={26}
              />
              <p className="text-xs text-gray-500 mt-1">
                با IR شروع می‌شود و 26 کاراکتر است
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
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
            {isLoading ? 'در حال ذخیره...' : (isEditing ? 'ذخیره تغییرات' : 'ایجاد مشتری')}
          </button>
        </div>
      </form>
    </Modal>
  )
}