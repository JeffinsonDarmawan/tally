import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'
import { currencySymbol } from '@/lib/utils/format'

export interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  invalid?: boolean
  /** Render larger, for the hero total. */
  large?: boolean
}

/** A numeric money input with the currency symbol as a leading adornment, tabular figures. */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { invalid, large, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      <span
        className={cn(
          'pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint',
          large && 'text-xl',
        )}
      >
        {currencySymbol()}
      </span>
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        className={cn(
          'num w-full rounded-xl border bg-elevated pr-3 pl-8 tabular-nums text-ink placeholder:text-faint',
          'transition-colors duration-150 focus-visible:outline-none',
          large ? 'h-14 text-2xl font-bold tracking-tight pl-9' : 'h-11 text-[15px]',
          invalid ? 'border-owe/60 focus-visible:border-owe' : 'border-hairline focus-visible:border-accent/60',
          className,
        )}
        {...props}
      />
    </div>
  )
})
