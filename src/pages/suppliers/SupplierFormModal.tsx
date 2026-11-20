import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineCreditCard } from 'react-icons/hi'

import Modal from '@/components/ui/Modal'
import { supplierService } from '@/services/supplierService'
import { Supplier, SupplierCreate } from '@/types/supplier'

const createSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد'),
  national_code: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email('ایمیل معتبر نیست').optional().or(z.literal('')),
  address: z.string().optional(),
  contact_person: z.string().optional(),
  bank_card_number: z.string().optional(),
  bank_account: z.string().optional(),
  iban: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean(),
})

type FormData = z.infer<typeof createSchema>

interface SupplierFormModalProps {
  isOpen: boolean
  onClose: () => void
  supplier: Supplier | null
  onSuccess: () => void
}

export default function SupplierFormModal({ isOpen, onClose, supplier, onSuccess }: SupplierFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'bank'>('info')
  const isEditing = !!supplier

  const form = useForm<FormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      is_active: true,
    },
  })

  useEffect(() => {
    if (supplier && isOpen) {
      form.reset({
        name: supplier.name,
        national_code: supplier.national_code || '',
        phone: supplier.phone || '',
        mobile: supplier.mobile || '',
        email: supplier.email || '',
        address: supplier.address || '',
        contact_person: supplier.contact_person || '',
        bank_card_number: supplier.bank_card_number || '',
        bank_account: supplier.bank_account || '',
        iban: supplier.iban || '',
        notes: supplier.notes || '',
        is_active: supplier.is_active,
      })
    } else {
      form.reset({
        name: '',
        national_code: '',
        phone: '',
        mobile: '',
        email: '',
        address: '',
        contact_person: '',
        bank_card_number: '',
        bank_account: '',
        iban: '',
        notes: '',
        is_active: true,
      })
    }
    setActiveTab('info')
  }, [supplier, isOpen, form])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      if (isEditing && supplier) {
        await supplierService.updateSupplier(supplier.id, data)
        toast.success('اطلاعات تامین‌کننده با موفقیت به‌روز شد')
      } else {
        await supplierService.createSupplier(data)
        toast.success('تامین‌کننده جدید با موفقیت ایجاد شد')
      }
      onSuccess()
      form.reset()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در ذخیره تامین‌کننده')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'info' as const, label: 'اطلاعات اصلی', icon: HiOutlineUser },
    { id: 'bank' as const, label: 'اطلاعات بانکی', icon: HiOutlineCreditCard },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'ویرایش تامین‌کننده' : 'ایجاد تامین‌کننده جدید'}
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
                ? 'text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
            )}
          </button>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Tab: Info */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام تامین‌کننده *
              </label>
              <input
                {...form.register('name')}
                className="input-field"
                placeholder="نام شرکت یا شخص تامین‌کننده"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  کد ملی / شناسه ملی
                </label>
                <input
                  {...form.register('national_code')}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  شخص تماس
                </label>
                <div className="relative">
                  <HiOutlineUser className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...form.register('contact_person')}
                    className="input-field pr-10"
                    placeholder="نام شخص مسئول"
                  />
                </div>
              </div>
            </div>

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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                آدرس
              </label>
              <textarea
                {...form.register('address')}
                rows={2}
                className="input-field resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                یادداشت‌ها
              </label>
              <textarea
                {...form.register('notes')}
                rows={3}
                className="input-field resize-none"
                placeholder="توضیحات اضافی..."
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                id="is_active"
                {...form.register('is_active')}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                تامین‌کننده فعال است
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
                اطلاعات بانکی به صورت رمزنگاری شده در دیتابیس ذخیره می‌شوند.
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
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 shadow-lg"
          >
            {isLoading ? 'در حال ذخیره...' : (isEditing ? 'ذخیره تغییرات' : 'ایجاد تامین‌کننده')}
          </button>
        </div>
      </form>
    </Modal>
  )
}