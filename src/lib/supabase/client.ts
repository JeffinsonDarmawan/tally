import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * The single Supabase client for the app (browser, anon key).
 * RLS is the security boundary — see docs/database/DATABASE.md.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True only when both env vars are present — used to render a setup screen otherwise. */
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // Surface misconfiguration early in dev rather than failing on first query.
  console.warn(
    '[tally] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.',
  )
}

// A syntactically-valid placeholder keeps createClient from throwing when unconfigured;
// the app then renders a "backend not configured" notice instead of white-screening.
// No network call is made until a session exists or a query runs.
const FALLBACK_URL = 'https://placeholder.supabase.co'
const FALLBACK_KEY = 'public-anon-key-placeholder'

export const supabase = createClient<Database>(url || FALLBACK_URL, anonKey || FALLBACK_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // magic-link callback
  },
})
