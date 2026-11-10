import { createClient } from "@supabase/supabase-js"

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const configuredKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const SUPABASE_URL = configuredUrl || "https://<project>.supabase.co"
export const SUPABASE_ANON_KEY = configuredKey || "<anon key>"
export const IS_DEMO_MODE =
  !configuredUrl ||
  !configuredKey ||
  SUPABASE_URL.includes("<project>") ||
  SUPABASE_ANON_KEY.includes("<anon")
export const db = createClient(
  IS_DEMO_MODE ? "https://demo.supabase.co" : SUPABASE_URL,
  IS_DEMO_MODE ? "demo-anon-key-placeholder" : SUPABASE_ANON_KEY,
)
