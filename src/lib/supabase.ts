import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Both values are public. The anon key belongs in the browser; row
// policies and getUser() are what lock data down. If either one is
// missing I stay in local mode: no client, no accounts, and progress
// lives in this browser.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''

// persistSession and autoRefreshToken keep someone signed in across
// reloads without me handling the token. storageKey is namespaced so
// another Supabase app on this origin cannot read this session.
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'recall-lab:auth' } }) : null

export const CLOUD = supabase !== null
