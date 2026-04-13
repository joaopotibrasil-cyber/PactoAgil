/// <reference types="astro/client" />

type User = import('@supabase/supabase-js').User

declare namespace App {
  interface Locals {
    user: User | null;
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly PUBLIC_APP_URL: string;
  readonly GROQ_API_KEY: string;
  readonly RESEND_API_KEY: string;
  readonly DATABASE_URL: string;
  readonly STRIPE_SECRET_KEY: string;
  readonly STRIPE_TEST_SECRET_KEY: string;
  readonly STRIPE_PRICE_DESCOBERTA?: string;
  readonly STRIPE_PRICE_MOVIMENTO?: string;
  readonly STRIPE_PRICE_DIRECAO?: string;
  readonly STRIPE_PRICE_LIDERANCA?: string;
  readonly PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
