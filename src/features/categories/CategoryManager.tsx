import { useState } from 'react'
import { IconPlus, IconPencil, IconTrash, IconTags } from '@tabler/icons-react'
import {
  Button,
  Card,
  CategoryTile,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  ListDivider,
  ListRow,
  LoadingRows,
  SectionHeader,
} from '@/components/ui'
import type { Category } from '@/types/database.types'
import { useCategories } from './useCategories'
import { CategoryFormModal } from './CategoryFormModal'
import { deleteCategory } from './api'

/** Categories list with full CRUD, for the Settings page. */
export function CategoryManager({ groupId }: { groupId: string }) {
  const { categories, status, error, reload } = useCategories(groupId)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(category: Category) {
    setEditing(category)
    setFormOpen(true)
  }

  return (
    <section>
      <SectionHeader
        action={
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<IconPlus className="size-4" stroke={2.5} />}
            onClick={openCreate}
            disabled={status === 'loading'}
          >
            Add
          </Button>
        }
      >
        Categories
      </SectionHeader>

      <Card flush>
        {status === 'loading' ? (
          <LoadingRows rows={5} />
        ) : status === 'error' ? (
          <ErrorState description={error ?? undefined} onRetry={() => void reload()} />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={<IconTags className="size-7" stroke={1.75} />}
            title="No categories yet"
            description="Add a category to start organizing expenses."
            action={
              <Button size="sm" leftIcon={<IconPlus className="size-4" stroke={2.5} />} onClick={openCreate}>
                Add category
              </Button>
            }
          />
        ) : (
          categories.map((c, i) => (
            <div key={c.id}>
              {i > 0 && <ListDivider />}
              <ListRow
                leading={<CategoryTile icon={c.icon} color={c.color} />}
                title={c.name}
                subtitle={c.is_custom ? 'Custom' : 'Default'}
                trailing={
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      aria-label={`Edit ${c.name}`}
                      className="grid size-8 place-items-center rounded-lg text-faint transition-colors hover:bg-elevated hover:text-ink"
                    >
                      <IconPencil className="size-4" stroke={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(c)}
                      aria-label={`Delete ${c.name}`}
                      className="grid size-8 place-items-center rounded-lg text-faint transition-colors hover:bg-owe-soft hover:text-owe"
                    >
                      <IconTrash className="size-4" stroke={2} />
                    </button>
                  </div>
                }
              />
            </div>
          ))
        )}
      </Card>

      <CategoryFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        groupId={groupId}
        category={editing}
        count={categories.length}
        onSaved={reload}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteCategory(deleteTarget.id)
            await reload()
          }
        }}
        title={`Delete “${deleteTarget?.name ?? ''}”?`}
        message="Expenses keep their history but lose this category label. This can’t be undone."
        confirmLabel="Delete"
        danger
      />
    </section>
  )
}
