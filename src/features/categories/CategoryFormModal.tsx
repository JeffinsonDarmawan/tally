import { useEffect, useState } from 'react'
import { Button, CategoryTile, ColorPicker, Field, IconPicker, Input, Modal } from '@/components/ui'
import { PALETTE } from '@/config'
import type { Category } from '@/types/database.types'
import { createCategory, updateCategory } from './api'

export interface CategoryFormModalProps {
  open: boolean
  onClose: () => void
  groupId: string
  /** Existing category to edit, or null to create a new one. */
  category: Category | null
  /** Number of existing categories — used to place a new one at the end. */
  count: number
  onSaved: () => void
}

const DEFAULT_ICON = 'tools-kitchen-2'

export function CategoryFormModal({ open, onClose, groupId, category, count, onSaved }: CategoryFormModalProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(DEFAULT_ICON)
  const [color, setColor] = useState<string>(PALETTE[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Re-seed the form whenever the dialog opens for a different category.
  useEffect(() => {
    if (!open) return
    setName(category?.name ?? '')
    setIcon(category?.icon ?? DEFAULT_ICON)
    setColor(category?.color ?? PALETTE[0])
    setError(null)
  }, [open, category])

  async function onSubmit() {
    if (name.trim().length < 1) {
      setError('Give the category a name.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (category) {
        await updateCategory(category.id, { name: name.trim(), icon, color })
      } else {
        await createCategory({ group_id: groupId, name: name.trim(), icon, color, sort_order: count + 1 })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the category.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? 'Edit category' : 'New category'}
      footer={
        <Button fullWidth onClick={onSubmit} disabled={saving}>
          {saving ? 'Saving…' : category ? 'Save changes' : 'Add category'}
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <CategoryTile icon={icon} color={color} size="lg" />
          <div className="min-w-0">
            <p className="font-medium text-ink">{name.trim() || 'New category'}</p>
            <p className="text-sm text-subtle">Preview</p>
          </div>
        </div>

        <Field label="Name" htmlFor="cat-name" error={error ?? undefined}>
          <Input
            id="cat-name"
            placeholder="e.g. Coffee runs"
            value={name}
            autoFocus
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError(null)
            }}
          />
        </Field>

        <Field label="Color">
          <ColorPicker value={color} onChange={setColor} />
        </Field>

        <Field label="Icon">
          <IconPicker value={icon} onChange={setIcon} color={color} />
        </Field>
      </div>
    </Modal>
  )
}
