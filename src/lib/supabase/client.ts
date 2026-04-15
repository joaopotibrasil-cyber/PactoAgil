import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Durante `next build`, algumas páginas podem ser prerenderizadas no Node
  // sem que o ambiente de build injete as variáveis. Não devemos crashar o build
  // por um client helper que só é usado no browser.
  if (!url || !anonKey) {
    if (typeof window !== 'undefined') {
      throw new Error('Missing Supabase environment variables. Please check your .env file.');
    }
    return createBrowserClient('http://localhost', 'build-placeholder-anon-key');
  }

  return createBrowserClient(url, anonKey);
}
