import { useMemo, useState } from 'react'
import { IconSearch } from '@tabler/icons-react'
import { cn } from '@/lib/utils/cn'
import { ICON_REGISTRY } from './icons'

export interface IconPickerProps {
  /** Currently selected icon key. */
  value?: string
  onChange: (key: string) => void
  /** Tint used for the selected highlight (the category color). */
  color?: string
  className?: string
}

/** Searchable grid for choosing a category icon (CRUD in settings). */
export function IconPicker({ value, onChange, color = '#9C9CF0', className }: IconPickerProps) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ICON_REGISTRY
    return ICON_REGISTRY.filter((e) => e.key.includes(q) || e.label.includes(q))
  }, [query])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="relative">
        <IconSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" stroke={2} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search icons…"
          className="h-10 w-full rounded-xl border border-hairline bg-elevated pr-3 pl-9 text-sm text-ink placeholder:text-faint focus-visible:border-accent/50 focus-visible:outline-none"
        />
      </div>

      {results.length === 0 ? (
        <p className="py-6 text-center text-sm text-faint">No icons match “{query}”.</p>
      ) : (
        <div className="grid max-h-56 grid-cols-6 gap-1.5 overflow-y-auto pr-1">
          {results.map(({ key, label, Icon }) => {
            const active = key === value
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange(key)}
                aria-label={label}
                aria-pressed={active}
                className={cn(
                  'grid aspect-square place-items-center rounded-xl border transition-colors duration-150',
                  active ? 'border-transparent' : 'border-hairline text-subtle hover:bg-elevated hover:text-ink',
                )}
                style={active ? { backgroundColor: `${color}26`, color, borderColor: `${color}66` } : undefined}
              >
                <Icon className="size-5" stroke={2} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
