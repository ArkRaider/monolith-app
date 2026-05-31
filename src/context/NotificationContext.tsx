'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Toast {
  id: string;
  message: string;
  senders: string[]; // deduplicated sender handles for "A AND X OTHERS" collapse
}

interface NotificationContextValue {
  /** Show an ephemeral toast. Collapses concurrent messages into one banner. */
  notify: (message: string, sender?: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
const NotificationContext = createContext<NotificationContextValue>({
  notify: () => {},
});

export function useNotification() {
  return useContext(NotificationContext);
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [visible, setVisible] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear pending timers
  const clearTimers = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    if (exitTimer.current)    clearTimeout(exitTimer.current);
  }, []);

  // Schedule auto-dismiss
  const scheduleDismiss = useCallback(() => {
    clearTimers();
    dismissTimer.current = setTimeout(() => {
      setVisible(false);
      // Give the slide-out animation 300ms to complete before removing the node
      exitTimer.current = setTimeout(() => setToast(null), 300);
    }, 3000);
  }, [clearTimers]);

  const notify = useCallback((message: string, sender?: string) => {
    setToast(prev => {
      if (!prev) {
        // First toast in the batch — brand new
        return {
          id:      Math.random().toString(36).slice(2),
          message,
          senders: sender ? [sender] : [],
        };
      }
      // Collapse: mutate existing toast text, add sender to list
      const newSenders = sender && !prev.senders.includes(sender)
        ? [...prev.senders, sender]
        : prev.senders;

      const collapsed = buildCollapsedMessage(newSenders, message);
      return { ...prev, message: collapsed, senders: newSenders };
    });

    setVisible(true);
    scheduleDismiss(); // reset the 3-second countdown on every new hit
  }, [scheduleDismiss]);

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), [clearTimers]);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      {/* ── Toast Renderer ── */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          onClick={() => { setVisible(false); setTimeout(() => setToast(null), 300); }}
          style={{
            position:   'fixed',
            bottom:     '5.5rem',
            right:      '1rem',
            zIndex:     9999,
            maxWidth:   '320px',
            cursor:     'pointer',
            // Slide in from right, slide out to right
            transform:  visible ? 'translateX(0)' : 'translateX(calc(100% + 1.5rem))',
            opacity:    visible ? 1 : 0,
            transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease',
            background: 'var(--color-surface)',
            border:     'var(--border-weight) solid var(--color-border)',
            boxShadow:  'var(--ui-shadow)',
            padding:    '0.75rem 1rem',
            display:    'flex',
            flexDirection: 'column',
            gap:        '0.2rem',
          }}
        >
          <span
            style={{
              fontFamily:    'var(--font-primary)',
              fontSize:      '9px',
              fontWeight:    700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color:         'var(--color-secondary)',
            }}
          >
            NEW MESSAGE
          </span>
          <p
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize:   '11px',
              fontWeight: 700,
              color:      'var(--color-foreground)',
              margin:     0,
            }}
          >
            {toast.message}
          </p>
          {/* Progress bar draining over 3s */}
          <div
            style={{
              marginTop: '0.5rem',
              height:    '2px',
              background: 'var(--color-border)',
              overflow:  'hidden',
            }}
          >
            <div
              key={toast.id} // re-key on new toast to restart animation
              style={{
                height:          '100%',
                background:      'var(--color-primary)',
                transformOrigin: 'left',
                animation:       'toast-drain 3s linear forwards',
              }}
            />
          </div>
        </div>
      )}

      {/* Keyframe injected inline to avoid global CSS dependency */}
      <style>{`
        @keyframes toast-drain {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function buildCollapsedMessage(senders: string[], fallbackMessage: string): string {
  if (senders.length === 0) return fallbackMessage;
  if (senders.length === 1) return `@${senders[0]} sent you a message`;
  const [first, ...rest] = senders;
  return `@${first} and ${rest.length} other${rest.length > 1 ? 's' : ''} messaged`;
}
