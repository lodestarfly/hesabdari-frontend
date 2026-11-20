import { HiOutlineExclamation } from 'react-icons/hi'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

const variantStyles = {
  danger: 'bg-red-100 text-red-600',
  warning: 'bg-yellow-100 text-yellow-600',
  info: 'bg-blue-100 text-blue-600',
}

const confirmButtonStyles = {
  danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500/30',
  warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500/30',
  info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/30',
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تایید',
  cancelText = 'انصراف',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${variantStyles[variant]}`}>
            <HiOutlineExclamation className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 text-white rounded-xl transition-colors font-medium focus:outline-none focus:ring-4 disabled:opacity-50 ${confirmButtonStyles[variant]}`}
          >
            {isLoading ? 'در حال انجام...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}