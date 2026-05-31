import { IconCheck } from '@tabler/icons-react'
import { cn } from '@/lib/utils/cn'
import { PALETTE } from '@/config'

export interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  colors?: readonly string[]
  /** Accessible name for the swatch group. */
  'aria-label'?: string
  className?: string
}

/** Swatch grid for choosing a category or avatar color. */
export function ColorPicker({
  value,
  onChange,
  colors = PALETTE,
  className,
  'aria-label': ariaLabel = 'Color',
}: ColorPickerProps) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn('flex flex-wrap gap-2', className)}>
      {colors.map((c) => {
        const active = c.toLowerCase() === value.toLowerCase()
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={`Color ${c}`}
            aria-pressed={active}
            className={cn(
              'squircle grid size-9 place-items-center transition-transform duration-150',
              active ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : 'hover:scale-105',
            )}
            style={{ backgroundColor: c, color: 'var(--color-base)' }}
          >
            {active && <IconCheck className="size-4" stroke={3} />}
          </button>
        )
      })}
    </div>
  )
}
