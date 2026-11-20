import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import {
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineHome,
  HiOutlineLogout,
  HiOutlineShoppingBag,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineX,
} from 'react-icons/hi'
import { NavLink, useNavigate } from 'react-router-dom'

const menuItems = [
  { path: '/dashboard', label: 'داشبورد', icon: HiOutlineHome },
  { path: '/products', label: 'محصولات', icon: HiOutlineShoppingBag },
  { path: '/customers', label: 'مشتریان', icon: HiOutlineUserGroup },
  { path: '/suppliers', label: 'تامین‌کنندگان', icon: HiOutlineUserGroup },
  { path: '/invoices', label: 'فاکتورها', icon: HiOutlineDocumentText },
  { path: '/payments', label: 'پرداخت‌ها', icon: HiOutlineCurrencyDollar },
  { path: '/reports', label: 'گزارشات', icon: HiOutlineChartBar },
  { path: '/users', label: 'کاربران', icon: HiOutlineUsers },
  { path: '/settings', label: 'تنظیمات', icon: HiOutlineCog },
]

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()

  const handleLogout = () => {
    logout()
    toast.success('با موفقیت خارج شدید')
    navigate('/login')
  }

  const handleLinkClick = () => {
    if (onClose) onClose()
  }

  return (
    <aside className="w-64 bg-white border-l border-gray-200 flex flex-col h-screen sticky top-0 shrink-0 no-print relative">
      {onClose && (
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 left-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg z-10"
        >
          <HiOutlineX className="w-5 h-5" />
        </button>
      )}

      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        {' '}
        {/* ✅ کاهش از p-6 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">سایان</h2>
            <p className="text-xs text-gray-500">نسخه 1.0.0</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {' '}
        {/* ✅ کاهش از p-4 */}
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                /* ✅ کاهش از py-3 و rounded-xl */
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-3 border-t border-gray-200">
        {' '}
        {/* ✅ کاهش از p-4 */}
        <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
          {' '}
          {/* ✅ کاهش از rounded-xl */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {user?.full_name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
        >
          <HiOutlineLogout className="w-4 h-4" />
          خروج از سیستم
        </button>
      </div>
    </aside>
  )
}
