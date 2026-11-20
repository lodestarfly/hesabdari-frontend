import React, { Component, ErrorInfo, ReactNode } from 'react'
import { HiOutlineExclamation } from 'react-icons/hi'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <HiOutlineExclamation className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">خطا در بارگذاری صفحه</h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              یک خطای غیرمنتظره رخ داد. لطفاً صفحه را رفرش کنید.
            </p>
            {this.state.error && (
              <div className="bg-gray-100 rounded-lg p-3 mb-4 text-xs text-red-600 font-mono overflow-auto max-h-32" dir="ltr">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 text-white py-2.5 rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              رفرش صفحه
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}