import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  HiOutlineExclamation,
  HiOutlinePencil,
  HiOutlinePhotograph,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineTrash,
} from 'react-icons/hi'

import { categoryService } from '@/services/categoryService'
import { Product, productService } from '@/services/productService'

import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import CategoryManagerModal from './CategoryManagerModal.tsx'
import ProductFormModal from './ProductFormModal.tsx'

const API_URL = (import.meta as ImportMeta & { env: { VITE_API_URL: string } })
  .env.VITE_API_URL

export default function ProductsPage() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [stockFilter, setStockFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const limit = 10

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  // Fetch Products
  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryFilter, stockFilter],
    queryFn: () =>
      productService.getProducts({
        skip: page * limit,
        limit,
        search: search || undefined,
        category_id: categoryFilter ? parseInt(categoryFilter) : undefined,
        low_stock: stockFilter === 'low' ? true : undefined,
      }),
  })

  // Fetch Categories for filter
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getTree,
  })

  // ✅ Flatten categories برای نمایش در جدول
  const flattenCategories = (cats: any[], result: any[] = []): any[] => {
    cats.forEach((cat) => {
      result.push(cat)
      if (cat.children) flattenCategories(cat.children, result)
    })
    return result
  }

  const flatCategories = categories ? flattenCategories(categories) : []

  // ✅ Helper برای پیدا کردن نام دسته‌بندی
  const getCategoryName = (categoryId?: number | null): string => {
    if (!categoryId) return '—'
    const cat = flatCategories.find((c) => c.id === categoryId)
    return cat?.name || '—'
  }

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => productService.delete(id), // ✅ اصلاح شد
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('محصول با موفقیت حذف شد')
      setIsConfirmOpen(false)
      setProductToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'خطا در حذف محصول')
    },
  })

  const handleDelete = (product: Product) => {
    setProductToDelete(product)
    setIsConfirmOpen(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsFormModalOpen(true)
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setIsFormModalOpen(true)
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price || 0)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مدیریت محصولات</h1>
          <p className="text-gray-500 mt-1">
            {data ? `${data.total} محصول ثبت شده` : 'در حال بارگذاری...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <HiOutlinePhotograph className="w-5 h-5" />
            دسته‌بندی‌ها
          </button>
          <button
            onClick={handleCreate}
            className="btn-primary flex items-center gap-2"
          >
            <HiOutlinePlus className="w-5 h-5" />
            محصول جدید
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <HiOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در نام، کد، بارکد..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="input-field pr-10"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(0)
            }}
            className="input-field"
          >
            <option value="">همه دسته‌بندی‌ها</option>
            {flatCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value)
              setPage(0)
            }}
            className="input-field"
          >
            <option value="">همه محصولات</option>
            <option value="low">موجودی کم</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : data && data.products.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      تصویر
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      کد / نام
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      دسته‌بندی
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      موجودی
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      قیمت خرده
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      وضعیت
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.products.map((product) => {
                    const stockQty = product.stock_qty || 0 // ✅ هندل undefined
                    const minStock = product.min_stock || 0 // ✅ هندل undefined
                    const isLowStock = stockQty <= minStock && stockQty > 0
                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Image */}
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                            {product.image_url ? (
                              <img
                                src={`${API_URL}/uploads/${product.image_url}`}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <HiOutlinePhotograph className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                        </td>

                        {/* Code / Name */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-800">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              کد: {product.code}
                              {product.barcode &&
                                ` | بارکد: ${product.barcode}`}
                            </p>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {getCategoryName(product.category_id)}{' '}
                          {/* ✅ استفاده از helper */}
                        </td>

                        {/* Stock */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">
                              {stockQty}
                            </span>
                            <span className="text-xs text-gray-500">
                              {product.unit}
                            </span>
                            {isLowStock && (
                              <HiOutlineExclamation
                                className="w-5 h-5 text-red-500"
                                title="موجودی کم"
                              />
                            )}
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatPrice(product.retail_price)} تومان
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <Badge
                            variant={product.is_active ? 'success' : 'danger'}
                          >
                            {product.is_active ? 'فعال' : 'غیرفعال'}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="ویرایش"
                            >
                              <HiOutlinePencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <HiOutlineTrash className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    قبلی
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    بعدی
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="محصولی یافت نشد"
            description="هنوز محصولی ثبت نشده یا با فیلترهای شما مطابقت ندارد"
          />
        )}
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingProduct(null)
        }}
        product={editingProduct}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['products'] })
          setIsFormModalOpen(false)
          setEditingProduct(null)
        }}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['categories'] })
        }}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setProductToDelete(null)
        }}
        onConfirm={() =>
          productToDelete && deleteMutation.mutate(productToDelete.id)
        }
        title="حذف محصول"
        message={`آیا از حذف محصول "${productToDelete?.name}" اطمینان دارید؟`}
        confirmText="حذف"
        cancelText="انصراف"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
