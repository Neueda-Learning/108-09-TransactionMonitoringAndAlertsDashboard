import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

const ToastContext = createContext(null);

function buildToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function Toast({ toast, onDismiss }) {
  return (
    <article className={`toast toast-${toast.tone}`} role="status">
      <div className="toast-content">
        <p className="toast-message">{toast.message}</p>
        {toast.details ? <pre className="toast-details">{toast.details}</pre> : null}
      </div>
      <button className="btn btn-small btn-ghost" type="button" onClick={onDismiss}>
        Dismiss
      </button>
    </article>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutRefs = useRef(new Map());

  const removeToast = useCallback((toastId) => {
    const activeTimeout = timeoutRefs.current.get(toastId);
    if (activeTimeout) {
      window.clearTimeout(activeTimeout);
      timeoutRefs.current.delete(toastId);
    }

    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
  }, []);

  const showToast = useCallback(
    (message, options = {}) => {
      const toastId = buildToastId();
      const tone = options.tone || 'info';
      const duration = Number.isFinite(Number(options.duration)) ? Number(options.duration) : 4000;

      setToasts((currentToasts) => [
        ...currentToasts,
        {
          id: toastId,
          message,
          tone,
          details: options.details || ''
        }
      ]);

      if (duration > 0) {
        const timeoutId = window.setTimeout(() => {
          timeoutRefs.current.delete(toastId);
          setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
        }, duration);

        timeoutRefs.current.set(toastId, timeoutId);
      }

      return toastId;
    },
    []
  );

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutRefs.current.clear();
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      showToast,
      toastSuccess: (message, options = {}) => showToast(message, { ...options, tone: 'success' }),
      toastError: (message, options = {}) => showToast(message, { ...options, tone: 'error' }),
      toastInfo: (message, options = {}) => showToast(message, { ...options, tone: 'info' })
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.');
  }

  return context;
}

