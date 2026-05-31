import { useState, type ComponentType } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  IconHome,
  IconReceipt2,
  IconRepeat,
  IconChartPie,
  IconPlus,
  IconSettings,
  type IconProps,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils/cn'
import { APP_NAME } from '@/config'
import { Button, Modal } from '@/components/ui'

interface NavItem {
  to: string
  label: string
  Icon: ComponentType<IconProps>
}

const NAV: NavItem[] = [
  { to: '/', label: 'Home', Icon: IconHome },
  { to: '/history', label: 'History', Icon: IconReceipt2 },
  { to: '/recurring', label: 'Recurring', Icon: IconRepeat },
  { to: '/summary', label: 'Summary', Icon: IconChartPie },
]

/** The brand mark — a compact tally glyph. */
function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth={5} strokeLinecap="round">
        <line x1="16" y1="18" x2="16" y2="46" />
        <line x1="26" y1="18" x2="26" y2="46" />
        <line x1="36" y1="18" x2="36" y2="46" />
        <line x1="46" y1="18" x2="46" y2="46" />
        <line x1="12" y1="48" x2="50" y2="16" />
      </g>
    </svg>
  )
}

/** Placeholder Add-Expense modal — the real multi-step flow lands in Phase 3. */
function AddExpensePlaceholder({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add expense"
      footer={
        <Button fullWidth disabled>
          Coming in Phase 3
        </Button>
      }
    >
      <p className="text-sm text-subtle">
        The full add-expense flow — basics, who paid, who’s involved, and all five split modes — is
        built in Phase 3. This sheet is wired up so the design system and navigation can be reviewed.
      </p>
    </Modal>
  )
}

export function AppShell() {
  const [addOpen, setAddOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="min-h-[100dvh] bg-base">
      {/* ===== Desktop sidebar ===== */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-hairline bg-surface/40 px-4 py-6 lg:flex">
        <div className="flex items-center gap-2.5 px-2">
          <span className="squircle grid size-9 place-items-center bg-elevated text-accent">
            <Logo className="size-6" />
          </span>
          <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
        </div>

        <nav aria-label="Primary" className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                  isActive ? 'bg-elevated text-ink' : 'text-subtle hover:bg-elevated/50 hover:text-ink',
                )
              }
            >
              <Icon className="size-5" stroke={2} />
              {label}
            </NavLink>
          ))}

          <Button className="mt-3" leftIcon={<IconPlus className="size-4" stroke={2.5} />} onClick={() => setAddOpen(true)}>
            Add expense
          </Button>
        </nav>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'bg-elevated text-ink' : 'text-subtle hover:bg-elevated/50 hover:text-ink',
            )
          }
        >
          <IconSettings className="size-5" stroke={2} />
          Settings
        </NavLink>
      </aside>

      {/* ===== Mobile top bar ===== */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-hairline bg-base/80 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2">
          <span className="squircle grid size-8 place-items-center bg-elevated text-accent">
            <Logo className="size-5" />
          </span>
          <span className="font-semibold tracking-tight">{APP_NAME}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          aria-label="Settings"
          className="grid size-9 place-items-center rounded-xl text-subtle transition-colors hover:bg-elevated hover:text-ink"
        >
          <IconSettings className="size-5" stroke={2} />
        </button>
      </header>

      {/* ===== Main content ===== */}
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-28 lg:px-8 lg:pt-8 lg:pb-12">
          <Outlet />
        </div>
      </main>

      {/* ===== Mobile bottom tab bar with center Add action ===== */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-base/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-center px-2">
          <TabLink {...NAV[0]} />
          <TabLink {...NAV[1]} />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              aria-label="Add expense"
              className="-mt-6 grid size-14 place-items-center rounded-2xl bg-accent text-[var(--color-base)] shadow-pop transition-[filter] duration-150 hover:brightness-110 active:brightness-95"
            >
              <IconPlus className="size-7" stroke={2.5} />
            </button>
          </div>
          <TabLink {...NAV[2]} />
          <TabLink {...NAV[3]} />
        </div>
      </nav>

      <AddExpensePlaceholder open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

function TabLink({ to, label, Icon }: NavItem) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-150',
          isActive ? 'text-accent' : 'text-faint hover:text-subtle',
        )
      }
    >
      <Icon className="size-6" stroke={2} />
      {label}
    </NavLink>
  )
}
