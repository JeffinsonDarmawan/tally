import { supabase } from '@/lib/supabase/client'
import type { AmountMode, Json } from '@/types/database.types'
import { buildExpense, createExpense, type ExpenseDraft } from '@/features/expenses'
import type { Frequency } from './schedule'

/** Recurring split config — the modes that scale with a (possibly variable) amount. */
export interface RecurringSplit {
  involved: string[]
  method: 'equal' | 'shares' | 'percentage'
  weights?: Record<string, number>
  percentages?: Record<string, number>
}

/** App-shaped recurring template. */
export interface RecurringTemplate {
  id: string
  groupId: string
  name: string
  categoryId: string | null
  paidBy: string
  frequency: Frequency
  amountMode: AmountMode
  defaultAmount: number | null
  split: RecurringSplit
  anchorDay: number | null
  startDate: string
  endDate: string | null
  lastPostedPeriod: string | null
  active: boolean
}

/** Fields needed to create/update a template (no id / posting state). */
export interface TemplateInput {
  name: string
  categoryId: string | null
  paidBy: string
  frequency: Frequency
  amountMode: AmountMode
  defaultAmount: number | null
  split: RecurringSplit
  anchorDay: number | null
  startDate: string
  endDate: string | null
  active: boolean
}

interface TemplateRow {
  id: string
  group_id: string
  name: string
  category_id: string | null
  paid_by: string
  frequency: Frequency
  amount_mode: AmountMode
  default_amount: number | null
  split_config: Json
  anchor_day: number | null
  start_date: string
  end_date: string | null
  last_posted_period: string | null
  active: boolean
}

function fromRow(r: TemplateRow): RecurringTemplate {
  return {
    id: r.id,
    groupId: r.group_id,
    name: r.name,
    categoryId: r.category_id,
    paidBy: r.paid_by,
    frequency: r.frequency,
    amountMode: r.amount_mode,
    defaultAmount: r.default_amount,
    split: (r.split_config as unknown as RecurringSplit) ?? { involved: [], method: 'equal' },
    anchorDay: r.anchor_day,
    startDate: r.start_date,
    endDate: r.end_date,
    lastPostedPeriod: r.last_posted_period,
    active: r.active,
  }
}

export async function fetchTemplates(groupId: string): Promise<RecurringTemplate[]> {
  const { data, error } = await supabase
    .from('recurring_templates')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r) => fromRow(r as TemplateRow))
}

export async function createTemplate(groupId: string, input: TemplateInput): Promise<void> {
  const { error } = await supabase.from('recurring_templates').insert({
    group_id: groupId,
    name: input.name,
    category_id: input.categoryId,
    paid_by: input.paidBy,
    frequency: input.frequency,
    amount_mode: input.amountMode,
    default_amount: input.defaultAmount,
    split_method: input.split.method,
    split_config: input.split as unknown as Json,
    anchor_day: input.anchorDay,
    start_date: input.startDate,
    end_date: input.endDate,
    active: input.active,
  })
  if (error) throw error
}

/** Editing a template affects future instances only (last_posted_period is untouched). */
export async function updateTemplate(id: string, input: TemplateInput): Promise<void> {
  const { error } = await supabase
    .from('recurring_templates')
    .update({
      name: input.name,
      category_id: input.categoryId,
      paid_by: input.paidBy,
      frequency: input.frequency,
      amount_mode: input.amountMode,
      default_amount: input.defaultAmount,
      split_method: input.split.method,
      split_config: input.split as unknown as Json,
      anchor_day: input.anchorDay,
      start_date: input.startDate,
      end_date: input.endDate,
      active: input.active,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_templates').delete().eq('id', id)
  if (error) throw error
}

function draftFromTemplate(t: RecurringTemplate, amount: number, period: string): ExpenseDraft {
  return {
    date: period,
    categoryId: t.categoryId,
    note: t.name,
    totalAmount: amount,
    splitMethod: t.split.method,
    involved: t.split.involved,
    payers: [{ userId: t.paidBy, amount }],
    weights: t.split.method === 'shares' ? t.split.weights : undefined,
    percentages: t.split.method === 'percentage' ? t.split.percentages : undefined,
    receiptUrl: null,
  }
}

/** Confirm a due period: post a real expense from the template, then advance the period. */
export async function confirmDue(args: {
  template: RecurringTemplate
  period: string
  amount: number
  actor: string
}): Promise<void> {
  const { template, period, amount, actor } = args
  const draft = draftFromTemplate(template, amount, period)
  const built = buildExpense(draft)
  if (!built.ok) throw new Error(built.errors[0] ?? 'Could not build the expense.')
  await createExpense(template.groupId, actor, draft, built, template.id)
  await advancePeriod(template.id, period)
}

/** Skip a due period: advance without posting. */
export async function skipDue(templateId: string, period: string): Promise<void> {
  await advancePeriod(templateId, period)
}

async function advancePeriod(templateId: string, period: string): Promise<void> {
  const { error } = await supabase
    .from('recurring_templates')
    .update({ last_posted_period: period })
    .eq('id', templateId)
  if (error) throw error
}
