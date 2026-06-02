import { supabase } from '@/lib/supabase/client'

const BUCKET = 'receipts'

/**
 * Upload a receipt image to the `receipts` Storage bucket under the group's folder.
 * Returns the storage path to save on the expense. Attach-only — no OCR (brief §8, §14).
 * The bucket + RLS are created in docs/SUPABASE_SETUP.md.
 */
export async function uploadReceipt(file: File, groupId: string): Promise<string> {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
  const path = `${groupId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  return path
}

/** A time-limited signed URL to view a stored receipt (the bucket is private). */
export async function receiptSignedUrl(path: string, expiresInSeconds = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds)
  if (error) return null
  return data.signedUrl
}
