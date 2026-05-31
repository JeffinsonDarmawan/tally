import { cn } from '@/lib/utils/cn'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZES: Record<AvatarSize, string> = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-xl',
}

export interface AvatarProps {
  /** Person's display name — used for initials and alt text. */
  name: string
  /** The person's consistent avatar color (hex). */
  color: string
  /** Optional profile image; falls back to initials. */
  src?: string | null
  size?: AvatarSize
  className?: string
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Rounded-square ("squircle") avatar tile in the person's consistent color.
 * The app's signature motif — used everywhere a person appears.
 */
export function Avatar({ name, color, src, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'squircle inline-grid shrink-0 place-items-center overflow-hidden font-semibold select-none',
        'ring-1 ring-inset ring-black/10',
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: color, color: 'var(--color-base)' }}
      title={name}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  )
}
