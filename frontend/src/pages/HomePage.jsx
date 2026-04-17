import useToast from '../hooks/useToast.jsx'

export default function HomePage() {
  const { showToast, ToastComponent } = useToast()

  return (
    <div className="p-4 space-y-3">
      {ToastComponent}
      <p className="text-sm text-gray-500">Toast 검증</p>
      <button
        className="block w-full py-2 rounded-lg bg-success text-white text-sm font-medium"
        onClick={() => showToast('저장되었습니다', 'success')}
      >
        success Toast
      </button>
      <button
        className="block w-full py-2 rounded-lg bg-error text-white text-sm font-medium"
        onClick={() => showToast('오류가 발생했습니다', 'error')}
      >
        error Toast
      </button>
    </div>
  )
}
