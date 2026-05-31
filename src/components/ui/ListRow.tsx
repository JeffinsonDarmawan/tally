import type { ReactNode } from 'react'
import { IconChevronRight } from '@tabler/icons-react'
import { cn } from '@/lib/utils/cn'

export interface ListRowProps {
  /** Leading visual — an Avatar, category icon tile, etc. */
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  /** Trailing content — usually an amount + meta, right-aligned. */
  trailing?: ReactNode
  onClick?: () => void
  /** Show a chevron affordance when the row navigates somewhere. */
  chevron?: boolean
  className?: string
}

/** A single, tappable list row. The workhorse of lists across the app. */
export function ListRow({ leading, title, subtitle, trailing, onClick, chevron, className }: ListRowProps) {
  const interactive = typeof onClick === 'function'
  const Tag = interactive ? 'button' : 'div'
  return (
    <Tag
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150',
        interactive && 'hover:bg-elevated/50 focus-visible:outline-none focus-visible:bg-elevated/50',
        className,
      )}
    >
      {leading && <span className="shrink-0">{leading}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-ink">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[13px] text-subtle">{subtitle}</span>}
      </span>
      {trailing && <span className="shrink-0 text-right">{trailing}</span>}
      {interactive && chevron && <IconChevronRight className="size-4 shrink-0 text-faint" stroke={2} />}
    </Tag>
  )
}

/** Hairline divider between rows in a flush Card. */
export function ListDivider() {
  return <div className="mx-4 h-px bg-hairline" role="separator" />
}
