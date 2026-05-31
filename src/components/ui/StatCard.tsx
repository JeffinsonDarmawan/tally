import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

type Tone = 'owed' | 'owe' | 'neutral'

const TONES: Record<Tone, { card: string; value: string; label: string }> = {
  owed: {
    card: 'bg-owed-soft border-owed/15',
    value: 'text-owed',
    label: '!text-owed',
  },
  owe: {
    card: 'bg-owe-soft border-owe/15',
    value: 'text-owe',
    label: '!text-owe',
  },
  neutral: {
    card: 'bg-surface border-hairline',
    value: 'text-ink',
    label: 'text-faint',
  },
}

export interface StatCardProps {
  label: string
  /** Pre-formatted value (e.g. "$124.50") rendered in tabular figures. */
  value: ReactNode
  tone?: Tone
  icon?: ReactNode
  /** Small secondary line under the value (e.g. "across 3 friends"). */
  hint?: ReactNode
  onClick?: () => void
  className?: string
  style?: CSSProperties
}

/** Soft tinted stat card with a bold figure — the dashboard's owed / owe tiles. */
export function StatCard({ label, value, tone = 'neutral', icon, hint, onClick, className, style }: StatCardProps) {
  const t = TONES[tone]
  const interactive = typeof onClick === 'function'
  const Tag = interactive ? 'button' : 'div'
  return (
    <Tag
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      style={style}
      className={cn(
        'rounded-card border p-4 text-left transition-[filter] duration-150',
        t.card,
        interactive && 'hover:brightness-110',
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        {icon && <span className={cn('shrink-0', t.label)}>{icon}</span>}
        <span className={cn('micro-label', t.label)}>{label}</span>
      </div>
      <div className={cn('num mt-2 text-2xl font-bold tracking-tight tabular-nums', t.value)}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-subtle">{hint}</div>}
    </Tag>
  )
}
