import { supabase } from '@/lib/supabase/client'

/**
 * Send a passwordless magic link to the given email.
 * The link returns the user to the app origin; `detectSessionInUrl` (client.ts)
 * completes the sign-in. The origin must be allow-listed in Supabase Auth → URL config.
 */
export async function sendMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
}
