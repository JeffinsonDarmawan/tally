import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import { cn } from '@/lib/utils/cn'

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
 * The container for the multi-step flows (Add Expense, Settle up).
 */
export function Modal({ open, onClose, title, footer, children, className }: ModalProps) {
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
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
        className={cn(
          'relative z-10 mt-auto flex max-h-[92dvh] w-full flex-col bg-surface shadow-pop',
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
