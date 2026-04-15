import { NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const searchSchema = z.string().min(2).max(100).regex(/^[\p{L}\p{N}\s\-\.]+$/u);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Evita crash em build/boot quando o ambiente não injeta vars.
  if (!url || !key) return null;

  // Inicializando Supabase nativamente para bypassar o compilador do Prisma em Edge
  return createClient(url, key);
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 }
      );
    }

    // Rate limiting por IP (usando headers)
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = rateLimit(`api:${ip}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return new NextResponse('Too many requests', { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json([]);
    }

    // Validação da query
    const validation = searchSchema.safeParse(query);
    if (!validation.success) {
      return NextResponse.json([]);
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

    return NextResponse.json(companies || []);
  } catch (error: any) {
    console.error('[COMPANIES_SEARCH_ERROR]', error);
    return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
  }
}
