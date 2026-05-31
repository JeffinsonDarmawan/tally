import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  fullWidth?: boolean
  'aria-label'?: string
  className?: string
}

/** Segmented control for mutually-exclusive choices (e.g. split mode, Month/Year). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth,
  className,
  ...a11y
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={a11y['aria-label']}
      className={cn(
        'inline-flex rounded-xl border border-hairline bg-elevated/60 p-1',
        fullWidth && 'flex w-full',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative flex-1 rounded-lg font-medium transition-colors duration-150',
              size === 'sm' ? 'px-3 py-1 text-[13px]' : 'px-4 py-1.5 text-sm',
              active ? 'bg-surface text-ink shadow-card ring-1 ring-hairline' : 'text-subtle hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
