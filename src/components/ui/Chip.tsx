import { cn } from '@/lib/utils/cn'
import { Avatar } from './Avatar'

export interface ChipProps {
  name: string
  color: string
  src?: string | null
  /** Selected state — used in member pickers. */
  selected?: boolean
  onClick?: () => void
  className?: string
}

/**
 * A person chip: squircle avatar + name in a rounded pill.
 * Doubles as a toggle in member-selection contexts (`selected` + `onClick`).
 */
export function Chip({ name, color, src, selected, onClick, className }: ChipProps) {
  const interactive = typeof onClick === 'function'
  const Tag = interactive ? 'button' : 'span'
  return (
    <Tag
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={interactive ? !!selected : undefined}
      className={cn(
        'inline-flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-medium transition-colors duration-150',
        selected
          ? 'bg-accent/15 text-ink ring-1 ring-accent/40'
          : 'bg-elevated text-subtle ring-1 ring-hairline',
        interactive && 'hover:text-ink',
        className,
      )}
    >
      <Avatar name={name} color={color} src={src} size="xs" />
      {name}
    </Tag>
  )
}
