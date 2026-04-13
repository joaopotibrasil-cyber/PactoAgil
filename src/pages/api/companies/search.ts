import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const searchSchema = z.string().min(2).max(100).regex(/^[\p{L}\p{N}\s\-\.]+$/u);

export const prerender = false;

// Inicializando Supabase nativamente com Service Role se disponível
const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL!,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY! || import.meta.env.PUBLIC_SUPABASE_ANON_KEY!
);

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const query = url.searchParams.get('q');

    if (!query) {
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Validação da query
    const validation = searchSchema.safeParse(query);
    if (!validation.success) {
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const sanitizedQuery = validation.data;

    const { data: companies, error } = await supabase
      .from('Empresa')
      .select('id, nome, cnpj')
      .or(`nome.ilike.%${sanitizedQuery}%,cnpj.ilike.%${sanitizedQuery}%`)
      .limit(5);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(companies || []), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('[COMPANIES_SEARCH_ERROR]', error);
    return new Response(JSON.stringify({ error: 'Internal Error', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
