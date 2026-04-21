import { createPortal } from 'react-dom'

export default function Toast({ message, type = 'success', offsetTop = 72 }) {
  const borderColor =
    type === 'success' ? 'var(--color-success)' : 'var(--color-error)'

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className="fixed left-1/2 z-[70] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border-l-4 bg-white px-4 py-3 text-sm font-medium shadow-lg animate-fadeIn"
      style={{ top: offsetTop, borderLeftColor: borderColor }}
    >
      <span className="block truncate">{message}</span>
    </div>,
    document.body
  )
}
