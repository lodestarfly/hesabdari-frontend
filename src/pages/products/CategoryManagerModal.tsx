import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  HiOutlineFolder,
  HiOutlineFolderOpen,
  HiOutlinePencil,
  HiOutlineTrash,
} from 'react-icons/hi'
import { z } from 'zod'

import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import { categoryService } from '@/services/categoryService'
import { Category, CategoryCreate } from '@/types/category'

// ✅ schema ساده بدون preprocess
const categorySchema = z.object({
  name: z.string().min(2, 'نام دسته‌بندی باید حداقل 2 کاراکتر باشد'),
  description: z.string().optional(),
  parent_id: z.string(), // ✅ رشته (مقدار select)
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CategoryManagerModal({
  isOpen,
  onClose,
  onSuccess,
}: CategoryManagerModalProps) {
  const queryClient = useQueryClient()
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  )

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      parent_id: '', // ✅ رشته خالی
    },
  })

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getTree,
    enabled: isOpen,
  })

  const createMutation = useMutation({
    mutationFn: (data: CategoryCreate) => categoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('دسته‌بندی ایجاد شد')
      handleCancel()
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'خطا در ایجاد دسته‌بندی')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryCreate }) =>
      categoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('دسته‌بندی به‌روز شد')
      handleCancel()
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'خطا در به‌روزرسانی')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('دسته‌بندی حذف شد')
      setIsConfirmOpen(false)
      setCategoryToDelete(null)
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'خطا در حذف')
    },
  })

  // ✅ تبدیل رشته به عدد/null در onSubmit
  const onSubmit = (data: CategoryFormData) => {
    const payload: CategoryCreate = {
      name: data.name,
      description: data.description || '',
      parent_id: data.parent_id === '' ? null : Number(data.parent_id),
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    form.reset({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id ? String(category.parent_id) : '', // ✅ رشته
    })
  }

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category)
    setIsConfirmOpen(true)
  }

  const handleCancel = () => {
    setEditingCategory(null)
    form.reset({
      name: '',
      description: '',
      parent_id: '',
    })
  }

  // Flatten categories with depth
  const flattenWithDepth = (
    cats: Category[],
    depth: number = 0,
    result: Array<Category & { depth: number }> = []
  ): Array<Category & { depth: number }> => {
    cats.forEach((cat) => {
      result.push({ ...cat, depth })
      if (cat.children && cat.children.length > 0) {
        flattenWithDepth(cat.children, depth + 1, result)
      }
    })
    return result
  }

  const flatCategories = categories ? flattenWithDepth(categories) : []

  // جلوگیری از انتخاب خود یا فرزندان به عنوان والد
  const getDescendantIds = (cat: Category, ids: number[] = []): number[] => {
    ids.push(cat.id)
    cat.children?.forEach((child) => getDescendantIds(child, ids))
    return ids
  }

  const excludedIds = editingCategory ? getDescendantIds(editingCategory) : []
  const parentOptions = flatCategories.filter(
    (c) => !excludedIds.includes(c.id)
  )

  const renderCategoryTree = () => {
    if (isLoading) {
      return (
        <p className="text-center text-gray-500 py-4">در حال بارگذاری...</p>
      )
    }

    if (flatCategories.length === 0) {
      return (
        <p className="text-center text-gray-500 py-4">
          هنوز دسته‌بندی‌ای ایجاد نشده
        </p>
      )
    }

    return (
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {flatCategories.map((category) => {
          const hasChildren = category.children && category.children.length > 0
          const isRoot = category.depth === 0

          return (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ marginRight: `${category.depth * 24}px` }}
            >
              <div className="flex items-center gap-3 flex-1">
                {isRoot ? (
                  <HiOutlineFolder className="w-5 h-5 text-blue-600 shrink-0" />
                ) : (
                  <HiOutlineFolderOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800 text-sm truncate">
                      {category.name}
                    </p>
                    {hasChildren && (
                      <span className="text-xs text-gray-400">
                        ({category.children?.length} فرزند)
                      </span>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {category.description}
                    </p>
                  )}
                  {!isRoot && (
                    <p className="text-xs text-gray-400 mt-0.5">← زیرمجموعه</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="ویرایش"
                >
                  <HiOutlinePencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="حذف"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="مدیریت دسته‌بندی‌ها"
      size="lg"
    >
      <div className="space-y-6">
        {/* Form */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-bold text-gray-700 mb-3">
            {editingCategory ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}
          </h4>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  نام *
                </label>
                <input
                  {...form.register('name')}
                  className="input-field"
                  placeholder="نام دسته‌بندی"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  دسته‌بندی والد
                </label>
                <select {...form.register('parent_id')} className="input-field">
                  <option value="">بدون والد (ریشه)</option>
                  {parentOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {'  '.repeat(cat.depth)}
                      {cat.depth > 0 ? '└─ ' : ''}
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                توضیحات
              </label>
              <input
                {...form.register('description')}
                className="input-field"
                placeholder="توضیحات (اختیاری)"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary py-2 text-sm disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'در حال ذخیره...'
                  : editingCategory
                    ? 'به‌روزرسانی'
                    : 'ایجاد'}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium text-sm"
                >
                  انصراف
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Categories List - Tree View */}
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-3">
            دسته‌بندی‌های موجود ({flatCategories.length})
          </h4>
          {renderCategoryTree()}
        </div>
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setCategoryToDelete(null)
        }}
        onConfirm={() =>
          categoryToDelete && deleteMutation.mutate(categoryToDelete.id)
        }
        title="حذف دسته‌بندی"
        message={`آیا از حذف دسته‌بندی "${categoryToDelete?.name}" اطمینان دارید؟`}
        confirmText="حذف"
        cancelText="انصراف"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </Modal>
  )
}
