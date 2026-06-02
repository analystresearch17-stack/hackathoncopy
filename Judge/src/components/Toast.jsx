import { useState, useCallback, useEffect } from 'react'

let toastDispatch = null

export function useToast() {
  const show = useCallback((message, variant = 'info') => {
    if (toastDispatch) toastDispatch({ message, variant })
  }, [])
  return { show }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    toastDispatch = ({ message, variant }) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, message, variant }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 3000)
    }
    return () => { toastDispatch = null }
  }, [])

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.variant}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
