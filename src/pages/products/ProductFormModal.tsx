import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { HiOutlineUpload } from 'react-icons/hi'
import { z } from 'zod'

import Modal from '@/components/ui/Modal'
import { categoryService } from '@/services/categoryService'
import { productService } from '@/services/productService'
import { Category } from '@/types/category'

const API_URL = (import.meta as ImportMeta & { env: { VITE_API_URL: string } })
  .env.VITE_API_URL

// ✅ تایپ برای دسته‌بندی با depth
type CategoryWithDepth = Category & { depth: number }

const toNumber = (v: unknown): number | undefined => {
  if (v === '' || v === null || v === undefined) return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

// ✅ schema با رشته برای category_id
const productSchema = z.object({
  code: z.string().min(1, 'کد محصول الزامی است'),
  barcode: z.string().optional(),
  name: z.string().min(2, 'نام محصول باید حداقل 2 کاراکتر باشد'),
  category_id: z.string(), // ✅ رشته (مقدار select)
  unit: z.string().min(1, 'واحد الزامی است'),
  cost_price: z.number().min(0).optional(),
  retail_price: z.number().min(0, 'قیمت خرده باید مثبت باشد'),
  wholesale_price: z.number().min(0).optional(),
  min_wholesale_qty: z.number().min(0).optional(),
  corporate_price: z.number().min(0).optional(),
  stock_qty: z.number().min(0).optional(),
  min_stock: z.number().min(0).optional(),
  description: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  product?: any | null
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: ProductFormModalProps) {
  const queryClient = useQueryClient()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: '',
      barcode: '',
      name: '',
      category_id: '', // ✅ رشته خالی
      unit: 'عدد',
      cost_price: 0,
      retail_price: 0,
      wholesale_price: 0,
      min_wholesale_qty: 10,
      corporate_price: 0,
      stock_qty: 0,
      min_stock: 0,
      description: '',
    },
  })

  // ✅ useEffect برای پر کردن فرم هنگام ویرایش
  useEffect(() => {
    if (isOpen && product) {
      form.reset({
        code: product.code || '',
        barcode: product.barcode || '',
        name: product.name || '',
        category_id: product.category_id ? String(product.category_id) : '', // ✅ تبدیل به رشته
        unit: product.unit || 'عدد',
        cost_price: product.cost_price || 0,
        retail_price: product.retail_price || 0,
        wholesale_price: product.wholesale_price || 0,
        min_wholesale_qty: product.min_wholesale_qty || 10,
        corporate_price: product.corporate_price || 0,
        stock_qty: product.stock_qty || 0,
        min_stock: product.min_stock || 0,
        description: product.description || '',
      })

      if (product.image_url) {
        setImagePreview(`${API_URL}/uploads/${product.image_url}`)
      } else {
        setImagePreview(null)
      }
      setImageFile(null)
    } else if (isOpen && !product) {
      handleReset()
    }
  }, [isOpen, product])

  // ✅ دریافت دسته‌بندی‌ها با تایپ صریح
  const { data: flatCategories } = useQuery({
    queryKey: ['categories-flat'],
    queryFn: async (): Promise<CategoryWithDepth[]> => {
      const tree = await categoryService.getTree()

      const flattenWithDepth = (
        cats: any[],
        depth: number = 0,
        result: CategoryWithDepth[] = []
      ): CategoryWithDepth[] => {
        cats.forEach((cat) => {
          result.push({ ...cat, depth })
          if (cat.children && cat.children.length > 0) {
            flattenWithDepth(cat.children, depth + 1, result)
          }
        })
        return result
      }

      return flattenWithDepth(tree)
    },
    enabled: isOpen,
  })

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const categoryId =
        data.category_id === '' ? null : Number(data.category_id)

      const formData = new FormData()
      formData.append('code', data.code || '')
      formData.append('name', data.name || '')
      formData.append('unit', data.unit || 'عدد')
      formData.append('barcode', data.barcode || '')
      formData.append('cost_price', String(data.cost_price || 0))
      formData.append('retail_price', String(data.retail_price || 0))
      formData.append('wholesale_price', String(data.wholesale_price || 0))
      formData.append('min_wholesale_qty', String(data.min_wholesale_qty || 10))
      formData.append('corporate_price', String(data.corporate_price || 0))
      formData.append('stock_qty', String(data.stock_qty || 0))
      formData.append('min_stock', String(data.min_stock || 0))
      formData.append('description', data.description || '')
      formData.append('is_active', 'true')

      if (categoryId !== null && categoryId !== undefined) {
        formData.append('category_id', String(categoryId))
      }

      if (imageFile) {
        formData.append('image', imageFile)
      }

      return productService.create(formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('محصول با موفقیت ایجاد شد')
      handleReset()
      onSuccess()
    },
    onError: (error: any) => {
      console.error('Create product error:', error)

      // ✅ استخراج پیام خطا
      let message = 'خطا در ایجاد محصول'

      if (error?.response?.data?.detail) {
        const detail = error.response.data.detail

        if (typeof detail === 'string') {
          message = detail
        } else if (Array.isArray(detail)) {
          message = detail
            .map((e: any) => {
              const field = e.loc?.slice(1).join('.') || ''
              const msg = e.msg || ''
              return field ? `${field}: ${msg}` : msg
            })
            .join(' | ')
        } else if (typeof detail === 'object') {
          message = JSON.stringify(detail)
        }
      } else if (error?.message) {
        message = error.message
      }

      console.error('Error message:', message)
      toast.error(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!product?.id) throw new Error('محصول یافت نشد')

      // ✅ تبدیل category_id از رشته به عدد/null
      const categoryId =
        data.category_id === '' ? null : Number(data.category_id)

      const formData = new FormData()
      formData.append('code', data.code || '')
      formData.append('name', data.name || '')
      formData.append('unit', data.unit || 'عدد')
      formData.append('barcode', data.barcode || '')
      formData.append('cost_price', String(data.cost_price || 0))
      formData.append('retail_price', String(data.retail_price || 0))
      formData.append('wholesale_price', String(data.wholesale_price || 0))
      formData.append('min_wholesale_qty', String(data.min_wholesale_qty || 10))
      formData.append('corporate_price', String(data.corporate_price || 0))
      formData.append('stock_qty', String(data.stock_qty || 0))
      formData.append('min_stock', String(data.min_stock || 0))
      formData.append('description', data.description || '')
      formData.append('is_active', 'true')

      if (categoryId !== null && categoryId !== undefined) {
        formData.append('category_id', String(categoryId))
      }

      if (imageFile) {
        formData.append('image', imageFile)
      }

      return productService.update(product.id, formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('محصول با موفقیت به‌روز شد')
      handleReset()
      onSuccess()
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.detail || 'خطا در به‌روزرسانی محصول'
      const message =
        typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)
      toast.error(message)
    },
  })

  const onSubmit = (data: ProductFormData) => {
    if (product?.id) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const handleReset = () => {
    form.reset({
      code: '',
      barcode: '',
      name: '',
      category_id: '', // ✅ رشته خالی
      unit: 'عدد',
      cost_price: 0,
      retail_price: 0,
      wholesale_price: 0,
      min_wholesale_qty: 10,
      corporate_price: 0,
      stock_qty: 0,
      min_stock: 0,
      description: '',
    })
    setImageFile(null)
    setImagePreview(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const isEditing = !!product?.id

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset()
        onClose()
      }}
      title={isEditing ? 'ویرایش محصول' : 'ایجاد محصول جدید'}
      size="lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* تصویر محصول */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            تصویر محصول
          </label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <HiOutlineUpload className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                <HiOutlineUpload className="w-4 h-4" />
                انتخاب تصویر
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                فرمت‌های مجاز: JPG, PNG, WEBP - حداکثر 10 مگابایت
              </p>
            </div>
          </div>
        </div>

        {/* کد محصول و بارکد */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              کد محصول *
            </label>
            <input
              {...form.register('code')}
              className="input-field"
              placeholder="کد محصول"
            />
            {form.formState.errors.code && (
              <p className="mt-1 text-xs text-red-500">
                {form.formState.errors.code.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              بارکد
            </label>
            <input
              {...form.register('barcode')}
              className="input-field"
              placeholder="بارکد (اختیاری)"
            />
          </div>
        </div>

        {/* نام محصول */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نام محصول *
          </label>
          <input
            {...form.register('name')}
            className="input-field"
            placeholder="نام محصول"
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-xs text-red-500">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        {/* دسته‌بندی و واحد */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              دسته‌بندی
            </label>
            <select
              {...form.register('category_id')} // ✅ بدون setValueAs
              className="input-field"
            >
              <option value="">بدون دسته‌بندی</option>
              {flatCategories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {'  '.repeat(cat.depth)}
                  {cat.depth > 0 ? '└─ ' : ''}
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              واحد *
            </label>
            <select {...form.register('unit')} className="input-field">
              <option value="عدد">عدد</option>
              <option value="کیلوگرم">کیلوگرم</option>
              <option value="گرم">گرم</option>
              <option value="متر">متر</option>
              <option value="سانتی‌متر">سانتی‌متر</option>
              <option value="لیتر">لیتر</option>
              <option value="میلی‌لیتر">میلی‌لیتر</option>
              <option value="بسته">بسته</option>
              <option value="جعبه">جعبه</option>
              <option value="کارتن">کارتن</option>
              <option value="دستگاه">دستگاه</option>
            </select>
          </div>
        </div>

        {/* قیمت‌ها */}
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-3">قیمت‌ها</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                قیمت خرید (تومان)
              </label>
              <input
                type="number"
                {...form.register('cost_price', {
                  valueAsNumber: true,
                  setValueAs: (v) => toNumber(v),
                })}
                className="input-field"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                قیمت خرده (تومان) *
              </label>
              <input
                type="number"
                {...form.register('retail_price', {
                  valueAsNumber: true,
                  setValueAs: (v) => toNumber(v) ?? 0,
                })}
                className="input-field"
                placeholder="0"
              />
              {form.formState.errors.retail_price && (
                <p className="mt-1 text-xs text-red-500">
                  {form.formState.errors.retail_price.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                قیمت عمده (تومان)
              </label>
              <input
                type="number"
                {...form.register('wholesale_price', {
                  valueAsNumber: true,
                  setValueAs: (v) => toNumber(v),
                })}
                className="input-field"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* حداقل تعداد عمده و قیمت همکاری */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              حداقل تعداد عمده
            </label>
            <input
              type="number"
              {...form.register('min_wholesale_qty', {
                valueAsNumber: true,
                setValueAs: (v) => toNumber(v),
              })}
              className="input-field"
              placeholder="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              قیمت همکاری (تومان)
            </label>
            <input
              type="number"
              {...form.register('corporate_price', {
                valueAsNumber: true,
                setValueAs: (v) => toNumber(v),
              })}
              className="input-field"
              placeholder="0"
            />
          </div>
        </div>

        {/* موجودی */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              موجودی فعلی
            </label>
            <input
              type="number"
              {...form.register('stock_qty', {
                valueAsNumber: true,
                setValueAs: (v) => toNumber(v),
              })}
              className="input-field"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              حداقل موجودی
            </label>
            <input
              type="number"
              {...form.register('min_stock', {
                valueAsNumber: true,
                setValueAs: (v) => toNumber(v),
              })}
              className="input-field"
              placeholder="0"
            />
          </div>
        </div>

        {/* توضیحات */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            توضیحات
          </label>
          <textarea
            {...form.register('description')}
            rows={3}
            className="input-field resize-none"
            placeholder="توضیحات محصول (اختیاری)"
          />
        </div>

        {/* دکمه‌ها */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              handleReset()
              onClose()
            }}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1 btn-primary py-3 disabled:opacity-50"
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'در حال ذخیره...'
              : isEditing
                ? 'به‌روزرسانی'
                : 'ایجاد'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
