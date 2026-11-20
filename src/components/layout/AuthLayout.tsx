import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg">
            <span className="text-4xl">📊</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
            سیستم حسابداری سایان
          </h1>
          <p className="text-blue-100 text-sm">نسخه 1.0.0</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-white/20">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-blue-100 text-xs">
          © 2026 تمامی حقوق محفوظ است
        </div>
      </div>
    </div>
  )
}
