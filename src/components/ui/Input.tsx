import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional leading adornment (e.g. an icon or a currency symbol). */
  leading?: ReactNode
  invalid?: boolean
}

/** Text input styled to the design system. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leading, invalid, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      {leading && (
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint">{leading}</span>
      )}
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-xl border bg-elevated px-3 text-[15px] text-ink placeholder:text-faint',
          'transition-colors duration-150 focus-visible:outline-none',
          invalid
            ? 'border-owe/60 focus-visible:border-owe'
            : 'border-hairline focus-visible:border-accent/60',
          leading && 'pl-9',
          className,
        )}
        {...props}
      />
    </div>
  )
})

/** Labeled field wrapper with optional hint / error text. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  // Associate the label with a single control when htmlFor is given; otherwise the
  // label names a group of controls (e.g. a color/icon picker) and we render plain text.
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label &&
        (htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-medium text-subtle">
            {label}
          </label>
        ) : (
          <span className="text-sm font-medium text-subtle">{label}</span>
        ))}
      {children}
      {error ? (
        <p className="text-xs text-owe" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-faint">{hint}</p>
      )}
    </div>
  )
}
