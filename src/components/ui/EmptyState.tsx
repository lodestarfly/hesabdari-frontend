import { HiOutlineInbox } from 'react-icons/hi'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        {icon || <HiOutlineInbox className="w-10 h-10 text-gray-400" />}
      </div>
      <h3 className="text-lg font-bold text-gray-700 mb-2">{title}</h3>
      {description && <p className="text-gray-500 text-sm">{description}</p>}
    </div>
  )
}