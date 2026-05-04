import { createPortal } from 'react-dom'

export default function Toast({ message, type = 'success', offsetTop = 72 }) {
  if (typeof document === 'undefined') return null

  const bg = type === 'error' ? 'bg-coral' : 'bg-g900'

  return createPortal(
    <div
      className={`fixed left-1/2 z-[70] -translate-x-1/2 max-w-[calc(100vw-2rem)] px-4 py-3 rounded-[14px] ${bg} text-white text-[14px] font-semibold shadow-frame animate-fadeIn`}
      style={{ top: offsetTop }}
    >
      <span className="block truncate">{message}</span>
    </div>,
    document.body
  )
}
