export default function Toast({ message, type = 'success' }) {
  const borderColor =
    type === 'success' ? 'var(--color-success)' : 'var(--color-error)'

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white shadow-lg rounded-lg px-4 py-3 text-sm font-medium border-l-4 animate-fadeIn whitespace-nowrap"
      style={{ borderLeftColor: borderColor }}
    >
      {message}
    </div>
  )
}
