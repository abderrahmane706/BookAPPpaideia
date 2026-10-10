import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * Uses only public (NEXT_PUBLIC_) variables. Authentication session handling
 * is added in a later phase; this client is safe to create from day one.
 *
 * Returns null (rather than throwing) when environment variables are absent,
 * so the first-phase shell can render without a configured backend.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient(url, anonKey);
}
