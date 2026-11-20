import { zodResolver } from '@hookform/resolvers/zod'
import * as jalaali from 'jalaali-js'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { HiOutlinePlus, HiOutlineSearch, HiOutlineTrash } from 'react-icons/hi'
import { z } from 'zod'

import Modal from '@/components/ui/Modal'
import PersianDatePicker from '@/components/ui/PersianDatePicker'
import { customerService } from '@/services/customerService'
import { invoiceService } from '@/services/invoiceService'
import { productService } from '@/services/productService'
import { supplierService } from '@/services/supplierService'
import { useSettingsStore } from '@/store/settingsStore'
import { Invoice, InvoiceItemCreate } from '@/types/invoice'
import { useQuery } from '@tanstack/react-query'

const itemSchema = z.object({
  product_id: z.number().min(1, 'محصول را انتخاب کنید'),
  description: z.string().optional(),
  quantity: z.number().min(0.001, 'تعداد باید بیشتر از صفر باشد'),
  unit_price: z.number().min(0, 'قیمت نمی‌تواند منفی باشد'),
  discount_amount: z.number().min(0, 'تخفیف نمی‌تواند منفی باشد'),
  discount_percent: z
    .number()
    .min(0, 'تخفیف نمی‌تواند منفی باشد')
    .max(100, 'تخفیف نمی‌تواند بیشتر از 100 باشد'),
  row_number: z.number(),
})

// Schema ساده بدون validation شرطی
const createSchema = z.object({
  invoice_type: z.enum(['sale', 'purchase', 'proforma']),
  customer_id: z.number().optional(),
  supplier_id: z.number().optional(),
  due_date: z.string().optional(),
  discount_amount: z.number().min(0).default(0),
  discount_percent: z.number().min(0).max(100).default(0),
  tax_percent: z.number().min(0).max(100).default(9),
  is_official: z.boolean().default(false),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'حداقل یک آیتم باید اضافه شود'),
})

type FormData = z.infer<typeof createSchema>

interface InvoiceFormModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice | null
  onSuccess: () => void
}

export default function InvoiceFormModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: InvoiceFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(
    null
  )
  const [selectedProductNames, setSelectedProductNames] = useState<
    Record<number, string>
  >({})
  const isEditing = !!invoice
  const settings = useSettingsStore()

  const form = useForm<z.input<typeof createSchema>, unknown, FormData>({
    resolver: zodResolver(createSchema),
    mode: 'onSubmit',
    defaultValues: {
      invoice_type: 'sale',
      discount_amount: 0,
      discount_percent: 0,
      tax_percent: settings.taxPercent || 9, // ✅ از تنظیمات
      is_official: false,
      items: [
        {
          product_id: 0,
          description: '',
          quantity: 1,
          unit_price: 0,
          discount_amount: 0,
          discount_percent: 0,
          row_number: 1,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const invoiceType = form.watch('invoice_type')
  const items = form.watch('items')

  // Fetch Customers & Suppliers
  const { data: customers } = useQuery({
    queryKey: ['customers', 'dropdown'],
    queryFn: () => customerService.getDropdown(),
    enabled: isOpen && (invoiceType === 'sale' || invoiceType === 'proforma'),
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', 'dropdown'],
    queryFn: () => supplierService.getDropdown(),
    enabled: isOpen && invoiceType === 'purchase',
  })

  // Fetch Products for search
  const { data: productsData } = useQuery({
    queryKey: ['products', 'search', productSearch],
    queryFn: () =>
      productService.getProducts({
        search: productSearch || undefined,
        limit: 10,
      }),
    enabled: isOpen && activeSearchIndex !== null && productSearch.length > 0,
  })

  const products = productsData?.products || []

  useEffect(() => {
    if (invoice && isOpen) {
      // ✅ حالت ویرایش: مقدار ذخیره‌شده در فاکتور
      const names: Record<number, string> = {}
      invoice.items.forEach((item, idx) => {
        names[idx] = item.description || `محصول ${idx + 1}`
      })
      setSelectedProductNames(names)

      form.reset({
        invoice_type: invoice.invoice_type,
        customer_id: invoice.customer_id || undefined,
        supplier_id: invoice.supplier_id || undefined,
        due_date: invoice.due_date || '',
        discount_amount: invoice.discount_amount,
        discount_percent: invoice.discount_percent,
        tax_percent: invoice.tax_percent, // ✅ مقدار ذخیره‌شده
        is_official: invoice.is_official,
        notes: invoice.notes || '',
        items: invoice.items.map((item, idx) => ({
          product_id: item.product_id,
          description: item.description || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount,
          discount_percent: item.discount_percent,
          row_number: idx + 1,
        })),
      })
    } else if (isOpen) {
      // ✅ حالت ایجاد جدید: از تنظیمات بخوان
      setSelectedProductNames({})
      form.reset({
        invoice_type: 'sale',
        discount_amount: 0,
        discount_percent: 0,
        tax_percent: settings.taxPercent || 9, // ✅ از تنظیمات (اصلاح شد)
        is_official: false,
        items: [
          {
            product_id: 0,
            description: '',
            quantity: 1,
            unit_price: 0,
            discount_amount: 0,
            discount_percent: 0,
            row_number: 1,
          },
        ],
      })
    }
    setProductSearch('')
    setActiveSearchIndex(null)
  }, [invoice, isOpen, form, settings.taxPercent]) // ✅ اضافه شدن settings.taxPercent

  const addItem = () => {
    append({
      product_id: 0,
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_amount: 0,
      discount_percent: 0,
      row_number: fields.length + 1,
    })
  }

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
      const newNames: Record<number, string> = {}
      Object.entries(selectedProductNames).forEach(([key, value]) => {
        const keyNum = parseInt(key)
        if (keyNum < index) {
          newNames[keyNum] = value
        } else if (keyNum > index) {
          newNames[keyNum - 1] = value
        }
      })
      setSelectedProductNames(newNames)
    } else {
      toast.error('حداقل یک آیتم باید وجود داشته باشد')
    }
  }

  const selectProduct = (
    itemIndex: number,
    product: (typeof products)[number]
  ) => {
    form.setValue(`items.${itemIndex}.product_id`, product.id)
    form.setValue(`items.${itemIndex}.unit_price`, product.retail_price)
    form.setValue(`items.${itemIndex}.description`, product.name)
    form.setValue(`items.${itemIndex}.quantity`, 1)
    form.setValue(`items.${itemIndex}.discount_amount`, 0)
    form.setValue(`items.${itemIndex}.discount_percent`, 0)

    setSelectedProductNames((prev) => ({
      ...prev,
      [itemIndex]: product.name,
    }))

    setProductSearch('')
    setActiveSearchIndex(null)
  }

  const handleSearchChange = (index: number, value: string) => {
    setProductSearch(value)
    setActiveSearchIndex(index)
    form.setValue(`items.${index}.product_id`, 0)
    setSelectedProductNames((prev) => {
      const newNames = { ...prev }
      delete newNames[index]
      return newNames
    })
  }

  const calculateItemTotal = (index: number) => {
    const item = items[index]
    if (!item) return 0

    const quantity = parseFloat(String(item.quantity)) || 0
    const unitPrice = parseFloat(String(item.unit_price)) || 0
    const discountAmount = parseFloat(String(item.discount_amount)) || 0
    const discountPercent = parseFloat(String(item.discount_percent)) || 0

    let total = quantity * unitPrice
    if (discountPercent > 0) {
      total -= total * (discountPercent / 100)
    }
    total -= discountAmount
    return Math.max(0, total)
  }

  const subtotal = items.reduce((sum, _, index) => {
    return sum + calculateItemTotal(index)
  }, 0)

  const discountAmount = Number(form.watch('discount_amount')) || 0
  const discountPercent = Number(form.watch('discount_percent')) || 0
  const taxPercent = Number(form.watch('tax_percent')) || 0

  let afterDiscount = subtotal
  if (discountPercent > 0) {
    afterDiscount -= afterDiscount * (discountPercent / 100)
  }
  afterDiscount -= discountAmount

  const taxAmount = afterDiscount * (taxPercent / 100)
  const totalAmount = afterDiscount + taxAmount

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(price))
  }

  const onSubmit = async (data: FormData) => {
    // Validation دستی
    if (data.invoice_type === 'sale' || data.invoice_type === 'proforma') {
      if (!data.customer_id || data.customer_id <= 0) {
        toast.error('لطفاً مشتری را انتخاب کنید')
        return
      }
    }

    if (data.invoice_type === 'purchase') {
      if (!data.supplier_id || data.supplier_id <= 0) {
        toast.error('لطفاً تامین‌کننده را انتخاب کنید')
        return
      }
    }

    // بررسی محصولات
    const hasInvalidItems = data.items.some(
      (item) => !item.product_id || item.product_id <= 0
    )
    if (hasInvalidItems) {
      toast.error('لطفاً برای همه آیتم‌ها محصول انتخاب کنید')
      return
    }

    setIsLoading(true)
    try {
      const items: InvoiceItemCreate[] = data.items.map((item, idx) => ({
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        discount_percent: item.discount_percent,
        row_number: idx + 1,
      }))

      // تبدیل تاریخ شمسی به میلادی
      let dueDateIso: string | null = null
      if (data.due_date) {
        try {
          const [jYear, jMonth, jDay] = data.due_date.split('/').map(Number)
          const gDate = jalaali.toGregorian(jYear, jMonth, jDay)
          dueDateIso = `${gDate.gy}-${String(gDate.gm).padStart(2, '0')}-${String(gDate.gd).padStart(2, '0')}T00:00:00`
        } catch (error) {
          console.error('خطا در تبدیل تاریخ:', error)
          dueDateIso = null
        }
      }

      // ساخت داده‌های فاکتور
      const invoiceData: any = {
        invoice_type: data.invoice_type,
        discount_amount: data.discount_amount || 0,
        discount_percent: data.discount_percent || 0,
        tax_percent: data.tax_percent, // ✅ فقط از فرم (نه fallback هاردکد)
        is_official: data.is_official || false,
        notes: data.notes || '',
        items,
      }

      // اضافه کردن customer_id یا supplier_id
      if (data.invoice_type === 'sale' || data.invoice_type === 'proforma') {
        invoiceData.customer_id = data.customer_id
        invoiceData.supplier_id = null
      } else if (data.invoice_type === 'purchase') {
        invoiceData.supplier_id = data.supplier_id
        invoiceData.customer_id = null
      }

      if (dueDateIso) {
        invoiceData.due_date = dueDateIso
      }

      await invoiceService.createInvoice(invoiceData)
      toast.success('فاکتور با موفقیت ایجاد شد')
      onSuccess()
    } catch (error: any) {
      console.error('❌ Error creating invoice:', error)
      toast.error(error.response?.data?.detail || 'خطا در ایجاد فاکتور')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'ویرایش فاکتور' : 'ایجاد فاکتور جدید'}
      size="xl"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice Type & Party Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع فاکتور *
            </label>
            <select
              value={form.watch('invoice_type')}
              onChange={(e) => {
                const newType = e.target.value as
                  | 'sale'
                  | 'purchase'
                  | 'proforma'
                form.setValue('invoice_type', newType)
                form.setValue('customer_id', undefined)
                form.setValue('supplier_id', undefined)
              }}
              className="input-field"
              disabled={isEditing}
            >
              <option value="sale">فروش</option>
              <option value="purchase">خرید</option>
              <option value="proforma">پیش‌فاکتور</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {invoiceType === 'purchase' ? 'تامین‌کننده' : 'مشتری'} *
            </label>
            <select
              value={
                invoiceType === 'purchase'
                  ? form.watch('supplier_id') || ''
                  : form.watch('customer_id') || ''
              }
              onChange={(e) => {
                const value = e.target.value
                  ? Number(e.target.value)
                  : undefined
                if (invoiceType === 'purchase') {
                  form.setValue('supplier_id', value, { shouldValidate: true })
                  form.setValue('customer_id', undefined)
                } else {
                  form.setValue('customer_id', value, { shouldValidate: true })
                  form.setValue('supplier_id', undefined)
                }
              }}
              className="input-field"
            >
              <option value="">انتخاب کنید...</option>
              {invoiceType === 'purchase'
                ? suppliers?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                : customers?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاریخ سررسید
            </label>
            <PersianDatePicker
              value={form.watch('due_date')}
              onChange={(value) => form.setValue('due_date', value)}
              placeholder="انتخاب تاریخ سررسید"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="is_official"
              {...form.register('is_official')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="is_official"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              فاکتور رسمی باشد
            </label>
          </div>
        </div>

        {/* Items Section */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-700">آیتم‌های فاکتور</h4>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
            >
              <HiOutlinePlus className="w-4 h-4" />
              افزودن آیتم
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((item, index) => {
              const productId = items[index]?.product_id
              const productName = selectedProductNames[index] || ''
              const displayValue =
                productId && productId > 0 ? productName : productSearch

              return (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-xl p-4 relative"
                >
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="absolute top-2 left-2 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="حذف آیتم"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-12 gap-3">
                    {/* Product Search */}
                    <div className="col-span-12 md:col-span-4 relative">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        محصول *
                      </label>
                      <div className="relative">
                        <HiOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="جستجوی محصول..."
                          value={displayValue}
                          onChange={(e) =>
                            handleSearchChange(index, e.target.value)
                          }
                          onFocus={() => setActiveSearchIndex(index)}
                          className="input-field pr-9 text-sm"
                        />
                        {activeSearchIndex === index &&
                          productSearch.length > 0 &&
                          products.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {products.map((product) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    selectProduct(index, product)
                                  }}
                                  className="w-full px-3 py-2 text-right hover:bg-gray-50 border-b border-gray-100 last:border-0"
                                >
                                  <p className="text-sm font-medium text-gray-800">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    کد: {product.code} | موجودی:{' '}
                                    {product.stock_qty} {product.unit}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                      {form.formState.errors.items?.[index]?.product_id && (
                        <p className="mt-1 text-xs text-red-500">
                          محصول را انتخاب کنید
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        تعداد *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        {...form.register(`items.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                        className="input-field text-sm"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        قیمت واحد *
                      </label>
                      <input
                        type="number"
                        {...form.register(`items.${index}.unit_price`, {
                          valueAsNumber: true,
                        })}
                        className="input-field text-sm"
                      />
                    </div>

                    {/* Discount Percent */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        تخفیف %
                      </label>
                      <input
                        type="number"
                        {...form.register(`items.${index}.discount_percent`, {
                          valueAsNumber: true,
                        })}
                        className="input-field text-sm"
                      />
                    </div>

                    {/* Discount Amount */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        تخفیف (تومان)
                      </label>
                      <input
                        type="number"
                        {...form.register(`items.${index}.discount_amount`, {
                          valueAsNumber: true,
                        })}
                        className="input-field text-sm"
                      />
                    </div>

                    {/* Total */}
                    <div className="col-span-12">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        جمع کل آیتم
                      </label>
                      <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-800">
                        {formatPrice(calculateItemTotal(index))} تومان
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Totals Section */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                یادداشت‌ها
              </label>
              <textarea
                {...form.register('notes')}
                rows={4}
                className="input-field resize-none"
                placeholder="توضیحات اضافی..."
              />
            </div>

            {/* Right: Calculations */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    تخفیف کل (تومان)
                  </label>
                  <input
                    type="number"
                    {...form.register('discount_amount', {
                      valueAsNumber: true,
                    })}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    تخفیف کل (%)
                  </label>
                  <input
                    type="number"
                    {...form.register('discount_percent', {
                      valueAsNumber: true,
                    })}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    مالیات (%)
                  </label>
                  <input
                    type="number"
                    {...form.register('tax_percent', { valueAsNumber: true })}
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">جمع کل:</span>
                  <span className="font-medium">
                    {formatPrice(subtotal)} تومان
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">تخفیف:</span>
                  <span className="font-medium text-red-600">
                    -{formatPrice(subtotal - afterDiscount)} تومان
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">مالیات ({taxPercent}%):</span>
                  <span className="font-medium">
                    {formatPrice(taxAmount)} تومان
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between">
                  <span className="font-bold text-gray-800">مبلغ نهایی:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {formatPrice(totalAmount)} تومان
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
            {isLoading ? 'در حال ذخیره...' : 'ایجاد فاکتور'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
