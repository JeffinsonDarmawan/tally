import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Remove inner padding when the card hosts its own full-bleed content (e.g. a list). */
  flush?: boolean
}

/** A surface card: hairline border, soft radius, minimal shadow. */
export function Card({ flush, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-hairline bg-surface shadow-card',
        !flush && 'p-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/** Uppercase, letter-spaced micro-label that titles a section, with optional trailing action. */
export function SectionHeader({
  children,
  action,
  className,
}: {
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-2 flex items-center justify-between px-1', className)}>
      <h2 className="micro-label">{children}</h2>
      {action}
    </div>
  )
}
