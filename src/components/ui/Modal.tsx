import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import { cn } from '@/lib/utils/cn'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  /** Optional sticky footer (e.g. a primary action). */
  footer?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Modal that presents as a bottom sheet on mobile and a centered dialog on desktop.
 * The container for the multi-step flows (Add Expense, Settle up). Traps focus while open,
 * focuses the first control (unless the content sets autoFocus), and returns focus on close.
 */
export function Modal({ open, onClose, title, footer, children, className }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusable = () =>
      Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.offsetParent !== null,
      )

    // Initial focus (skip if content already auto-focused something inside the panel).
    const raf = requestAnimationFrame(() => {
      if (panelRef.current?.contains(document.activeElement)) return
      ;(focusable()[0] ?? panelRef.current)?.focus()
    })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) {
        e.preventDefault()
        panelRef.current?.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      const outside = !panelRef.current?.contains(active)
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      {/* Backdrop — pointer-only dismissal; keyboard users use Escape or the close button. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm motion-safe:animate-[fade_0.15s_ease]"
      />
      {/* Panel — bottom sheet on mobile, dialog on desktop */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative z-10 mt-auto flex max-h-[92dvh] w-full flex-col bg-surface shadow-pop focus:outline-none',
          'rounded-t-3xl sm:mt-0 sm:max-h-[88dvh] sm:max-w-lg sm:rounded-card-lg',
          'motion-safe:animate-[reveal_0.2s_var(--ease-out-soft)]',
          className,
        )}
      >
        {/* Grab handle (mobile) */}
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-hairline sm:hidden" aria-hidden />
        {title && (
          <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2 sm:pt-5">
            <h2 id={titleId} className="text-lg font-semibold text-ink">
              {title}
            </h2>
            <CloseButton onClose={onClose} />
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && (
          <div className="border-t border-hairline px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="grid size-8 place-items-center rounded-lg text-faint transition-colors hover:bg-elevated hover:text-ink"
    >
      <IconX className="size-5" stroke={2} />
    </button>
  )
}
