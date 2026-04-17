import { useState, useCallback } from 'react'
import Toast from '../components/Toast'

export default function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2000)
  }, [])

  const ToastComponent = toast
    ? <Toast message={toast.message} type={toast.type} />
    : null

  return { showToast, ToastComponent }
}
