import { useState } from 'react'
import { IconPencil, IconPlus } from '@tabler/icons-react'
import {
  Avatar,
  Button,
  Card,
  CategoryTile,
  Chip,
  IconPicker,
  ListDivider,
  ListRow,
  Modal,
  SectionHeader,
} from '@/components/ui'
import { PageHeader } from '@/features/misc'

const SAMPLE_CATEGORIES = [
  { name: 'Food & drink', icon: 'tools-kitchen-2', color: '#F4948B' },
  { name: 'Groceries', icon: 'shopping-cart', color: '#74E0A2' },
  { name: 'Transport', icon: 'car', color: '#6BC8D6' },
  { name: 'Rent', icon: 'home', color: '#9C9CF0' },
  { name: 'Utilities', icon: 'bulb', color: '#E0B35B' },
  { name: 'Entertainment', icon: 'device-tv', color: '#D199E8' },
]

const MEMBERS = [
  { name: 'You', color: '#9C9CF0' },
  { name: 'Emma', color: '#74E0A2' },
  { name: 'Leo', color: '#F4948B' },
  { name: 'Mia', color: '#E0B35B' },
  { name: 'Sam', color: '#6BC8D6' },
]

export function SettingsPage() {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [icon, setIcon] = useState('tools-kitchen-2')

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" subtitle="Group, members and categories." />

      {/* Profile */}
      <section>
        <SectionHeader>You</SectionHeader>
        <Card className="flex items-center gap-3">
          <Avatar name="You" color="#9C9CF0" size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">You</p>
            <p className="text-sm text-subtle">you@example.com</p>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<IconPencil className="size-4" stroke={2} />}>
            Edit
          </Button>
        </Card>
      </section>

      {/* Members */}
      <section>
        <SectionHeader>Members · 5</SectionHeader>
        <Card>
          <div className="flex flex-wrap gap-2">
            {MEMBERS.map((m) => (
              <Chip key={m.name} name={m.name} color={m.color} />
            ))}
          </div>
        </Card>
      </section>

      {/* Categories */}
      <section>
        <SectionHeader
          action={
            <Button variant="ghost" size="sm" leftIcon={<IconPlus className="size-4" stroke={2.5} />} disabled>
              Add
            </Button>
          }
        >
          Categories
        </SectionHeader>
        <Card flush>
          {SAMPLE_CATEGORIES.map((c, i) => (
            <div key={c.name}>
              {i > 0 && <ListDivider />}
              <ListRow
                onClick={() => setPickerOpen(true)}
                chevron
                leading={<CategoryTile icon={i === 0 ? icon : c.icon} color={c.color} />}
                title={c.name}
                subtitle="Default"
              />
            </div>
          ))}
        </Card>
        <p className="mt-2 px-1 text-xs text-faint">
          Full category CRUD with the icon picker lands in Phase 1. Tap a category to preview the picker.
        </p>
      </section>

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choose an icon"
        footer={
          <Button fullWidth onClick={() => setPickerOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="mb-4 flex items-center gap-3">
          <CategoryTile icon={icon} color="#F4948B" size="lg" />
          <p className="text-sm text-subtle">Pick an icon for this category.</p>
        </div>
        <IconPicker value={icon} onChange={setIcon} color="#F4948B" />
      </Modal>
    </div>
  )
}
