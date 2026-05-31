import { createClient } from '@supabase/supabase-js'

/**
 * The single Supabase client for the app (browser, anon key).
 * RLS is the security boundary — see docs/database/DATABASE.md.
 *
 * Generated DB types land in src/types/database.types.ts in Phase 1; once present,
 * type this as createClient<Database>(...).
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Surface misconfiguration early in dev rather than failing on first query.
  console.warn(
    '[tally] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.',
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // magic-link callback
  },
})
