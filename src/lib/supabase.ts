import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** null when env vars are missing: the data layer then falls back to in-memory demo data. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
