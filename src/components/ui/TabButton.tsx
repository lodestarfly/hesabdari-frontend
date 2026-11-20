import { ReactNode } from 'react'

interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}

export default function TabButton({
  active,
  onClick,
  icon,
  label,
}: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
        active
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
