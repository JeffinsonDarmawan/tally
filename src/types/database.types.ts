/**
 * Database types for the Supabase schema (docs/database/supabase_schema.sql).
 *
 * Hand-authored to mirror the schema so the app is type-safe before a project exists.
 * Once your Supabase project is created, you can regenerate this file with:
 *   npx supabase gen types typescript --project-id <id> --schema public > src/types/database.types.ts
 *
 * Note: `Relationships` arrays are populated only where the app navigates them today; the
 * generator fills the rest in. They affect IDE discovery only, not runtime or type safety.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type SplitMethod = 'by_item' | 'equal' | 'uneven' | 'shares' | 'percentage'
export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly'
export type AmountMode = 'fixed' | 'variable'

/** Auto-allocated extra charge on an expense (tax / tip / service). */
export interface ExtraCharge {
  label: string
  amount: number
  mode: 'proportional' | 'equal'
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          avatar_color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          avatar_color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          avatar_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          name: string
          currency_code: string
          time_zone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          currency_code?: string
          time_zone?: string
        }
        Update: {
          name?: string
          currency_code?: string
          time_zone?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          group_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          group_id?: string
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: 'group_members_group_id_fkey'; columns: ['group_id']; referencedRelation: 'groups'; referencedColumns: ['id'] },
          { foreignKeyName: 'group_members_user_id_fkey'; columns: ['user_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      categories: {
        Row: {
          id: string
          group_id: string
          name: string
          icon: string | null
          color: string | null
          is_custom: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          icon?: string | null
          color?: string | null
          is_custom?: boolean
          sort_order?: number
        }
        Update: {
          name?: string
          icon?: string | null
          color?: string | null
          is_custom?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'categories_group_id_fkey'; columns: ['group_id']; referencedRelation: 'groups'; referencedColumns: ['id'] },
        ]
      }
      recurring_templates: {
        Row: {
          id: string
          group_id: string
          name: string
          category_id: string | null
          paid_by: string
          frequency: Frequency
          amount_mode: AmountMode
          default_amount: number | null
          split_method: SplitMethod
          split_config: Json
          anchor_day: number | null
          start_date: string
          end_date: string | null
          last_posted_period: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          category_id?: string | null
          paid_by: string
          frequency: Frequency
          amount_mode: AmountMode
          default_amount?: number | null
          split_method: SplitMethod
          split_config?: Json
          anchor_day?: number | null
          start_date: string
          end_date?: string | null
          last_posted_period?: string | null
          active?: boolean
        }
        Update: Partial<Database['public']['Tables']['recurring_templates']['Insert']>
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          group_id: string
          paid_by: string | null
          date: string
          category_id: string | null
          total_amount: number
          split_method: SplitMethod
          split_config: Json
          extra_charges: Json
          note: string | null
          receipt_url: string | null
          recurring_template_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          paid_by?: string | null
          date?: string
          category_id?: string | null
          total_amount: number
          split_method: SplitMethod
          split_config?: Json
          extra_charges?: Json
          note?: string | null
          receipt_url?: string | null
          recurring_template_id?: string | null
          created_by: string
        }
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
        Relationships: []
      }
      expense_items: {
        Row: { id: string; expense_id: string; name: string; amount: number }
        Insert: { id?: string; expense_id: string; name: string; amount: number }
        Update: Partial<Database['public']['Tables']['expense_items']['Insert']>
        Relationships: []
      }
      expense_item_shares: {
        Row: { item_id: string; user_id: string }
        Insert: { item_id: string; user_id: string }
        Update: Partial<Database['public']['Tables']['expense_item_shares']['Insert']>
        Relationships: []
      }
      expense_shares: {
        Row: { expense_id: string; user_id: string; amount: number }
        Insert: { expense_id: string; user_id: string; amount: number }
        Update: Partial<Database['public']['Tables']['expense_shares']['Insert']>
        Relationships: []
      }
      expense_payers: {
        Row: { expense_id: string; user_id: string; amount_paid: number }
        Insert: { expense_id: string; user_id: string; amount_paid: number }
        Update: Partial<Database['public']['Tables']['expense_payers']['Insert']>
        Relationships: []
      }
      settlements: {
        Row: {
          id: string
          group_id: string
          from_user: string
          to_user: string
          amount: number
          date: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          from_user: string
          to_user: string
          amount: number
          date?: string
          note?: string | null
        }
        Update: Partial<Database['public']['Tables']['settlements']['Insert']>
        Relationships: []
      }
      activity_log: {
        Row: {
          id: string
          group_id: string
          actor: string
          action_type: string
          target_type: string | null
          target_id: string | null
          summary: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          actor: string
          action_type: string
          target_type?: string | null
          target_id?: string | null
          summary: string
          metadata?: Json
        }
        Update: Partial<Database['public']['Tables']['activity_log']['Insert']>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          message: string
          link: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          message: string
          link?: string | null
          read?: boolean
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      create_group: {
        Args: { p_name: string; p_currency_code?: string; p_time_zone?: string }
        Returns: string
      }
      is_group_member: {
        Args: { p_group_id: string }
        Returns: boolean
      }
      shares_group_with: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      can_access_expense: {
        Args: { p_expense_id: string }
        Returns: boolean
      }
      can_access_item: {
        Args: { p_item_id: string }
        Returns: boolean
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

/** Convenience row aliases. */
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Group = Database['public']['Tables']['groups']['Row']
export type GroupMember = Database['public']['Tables']['group_members']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']
