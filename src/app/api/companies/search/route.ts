import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';

const searchSchema = z.string().min(2).max(100).regex(/^[\p{L}\p{N}\s\-\.]+$/u);

export async function GET(req: Request) {
  try {
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

    const companies = await prisma.empresa.findMany({
      where: {
        OR: [
          { nome: { contains: sanitizedQuery, mode: 'insensitive' } },
          { cnpj: { contains: sanitizedQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        nome: true,
        cnpj: true,
      },
      take: 5,
    });

    return NextResponse.json(companies);
  } catch (error: any) {
    console.error('[COMPANIES_SEARCH_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
