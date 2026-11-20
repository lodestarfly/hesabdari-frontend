import { useAuthStore } from '@/store/authStore'
import { HiOutlineBell, HiOutlineCalendar, HiOutlineMenu } from 'react-icons/hi'

interface HeaderProps {
  onMenuToggle?: () => void
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuthStore()

  const getPersianDate = () => {
    try {
      return new Date().toLocaleDateString('fa-IR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return new Date().toLocaleDateString()
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-10 no-print">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <HiOutlineMenu className="w-5 h-5" />
          </button>
        )}

        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-800">
            {' '}
            {/* ✅ کاهش از text-2xl */}
            خوش آمدید، {user?.full_name || 'کاربر'} 👋
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
            <p className="text-xs md:text-sm text-gray-500">
              {getPersianDate()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button className="relative p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
          <HiOutlineBell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  )
}
