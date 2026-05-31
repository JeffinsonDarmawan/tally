import { IconDots, type IconProps } from '@tabler/icons-react'
import { resolveCategoryIcon } from './icons'

/** Render a category's icon from its stored value (`ti-foo`, `foo`, or an emoji). */
export function CategoryIcon({
  name,
  className,
  ...props
}: { name?: string | null; className?: string } & Omit<IconProps, 'name'>) {
  const Cmp = resolveCategoryIcon(name)
  if (Cmp) return <Cmp className={className} {...props} />
  if (!name) return <IconDots className={className} {...props} />
  // Unrecognized value → treat as an emoji / text glyph.
  return (
    <span className={className} aria-hidden style={{ fontSize: '1.1em', lineHeight: 1 }}>
      {name}
    </span>
  )
}
