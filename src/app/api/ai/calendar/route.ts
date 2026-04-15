import { NextRequest, NextResponse } from 'next/server';
import { getGroqCompletion } from '@/lib/ai/groq';
import { requireAuth } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;

    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Conteúdo do cronograma é obrigatório' }, { status: 400 });
    }

    // Busca empresa do usuário logado
    const perfil = await prisma.perfil.findUnique({
      where: { userId },
      select: { empresaId: true }
    });

    if (!perfil || !perfil.empresaId) {
      return NextResponse.json({ error: 'Usuário não possui empresa vinculada' }, { status: 400 });
    }

    const systemMessage = `Você é um robô extrator de dados. 
O usuário enviará um texto bruto contendo informações sobre um cronograma de negociações sindicais (datas-base, empresas, e possivelmente os CNPJs e tipos de instrumentos como ACT ou CCT).
Sua função é ler esse texto e extrair as negociações numa lista.
Para cada negociação identificada, retorne ESTRITAMENTE e UNICAMENTE um array JSON com a seguinte estrutura para cada item:
[
  {
    "nomeEmpresa": "Nome da Empresa ou Sindicato",
    "dataBase": "YYYY-MM-DD",
    "instrumento": "ACT" ou "CCT",
    "cnpjAlvo": "00000000000000" (se não fornecido, retorne null)
  }
]
Se não encontrar uma data exata, assuma o primeiro dia do mês mencionado (ex: "março 2024" = "2024-03-01").
NÃO retorne nenhum texto além do JSON, sem markdown \`\`\`json, retorne apenas o array bruto.`;

    const generatedText = await getGroqCompletion(content, systemMessage, "llama3-8b-8192");
    
    // Parse json
    let parsedData = [];
    try {
      const jsonStart = generatedText.indexOf('[');
      const jsonEnd = generatedText.lastIndexOf(']') + 1;
      const cleanJson = generatedText.slice(jsonStart, jsonEnd);
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Erro ao fazer parse do resultado da IA:', generatedText);
      return NextResponse.json({ error: 'Não foi possível interpretar os dados do cronograma.' }, { status: 422 });
    }

    // Insert to database
    const createdArr = [];
    for (const item of parsedData) {
      if (!item.nomeEmpresa || !item.dataBase) continue;
      
      const created = await prisma.negociacao.create({
        data: {
          empresaId: perfil.empresaId,
          nomeEmpresa: item.nomeEmpresa,
          dataBase: new Date(item.dataBase),
          instrumento: item.instrumento || 'ACT',
          status: 'Bancada Sindical Laboral', // Estado inicial
          cnpjAlvo: item.cnpjAlvo || null,
        }
      });
      createdArr.push(created);
    }

    return NextResponse.json({ success: true, count: createdArr.length, data: createdArr });

  } catch (error: any) {
    console.error('[AI_CALENDAR_ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao processar cronograma via IA: ' + (error.message || 'Erro desconhecido') }, 
      { status: 500 }
    );
  }
}
