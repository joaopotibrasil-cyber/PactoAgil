import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
  }

  return createBrowserClient(url, anonKey);
}
