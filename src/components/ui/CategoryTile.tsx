import { cn } from '@/lib/utils/cn'
import { CategoryIcon } from './CategoryIcon'

type TileSize = 'sm' | 'md' | 'lg'

const SIZES: Record<TileSize, { box: string; icon: string }> = {
  sm: { box: 'size-8', icon: 'size-4' },
  md: { box: 'size-10', icon: 'size-5' },
  lg: { box: 'size-12', icon: 'size-6' },
}

export interface CategoryTileProps {
  icon?: string | null
  /** Category color (hex) — used as a soft tint behind the icon. */
  color?: string | null
  size?: TileSize
  className?: string
}

/** Squircle tile holding a category icon over a soft tint of its color. */
export function CategoryTile({ icon, color = '#9A9AA2', size = 'md', className }: CategoryTileProps) {
  const c = color ?? '#9A9AA2'
  const s = SIZES[size]
  return (
    <span
      className={cn('squircle grid shrink-0 place-items-center', s.box, className)}
      style={{ backgroundColor: `${c}1f`, color: c }}
    >
      <CategoryIcon name={icon} className={s.icon} stroke={2} />
    </span>
  )
}
