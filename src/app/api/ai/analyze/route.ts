import { NextRequest, NextResponse } from 'next/server';
import { getGroqCompletion } from '@/lib/ai/groq';
import { requireAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;


    const { documentContent, scenario } = await req.json();

    if (!documentContent) {
      return NextResponse.json({ error: 'Conteúdo do documento é obrigatório' }, { status: 400 });
    }

    const prompt = `
Analise o seguinte documento de negociação coletiva de trabalho e extraia os principais campos/cláusulas.

DOCUMENTO:
---
${documentContent.substring(0, 6000)}
---

CONTEXTO: O cenário selecionado é "${scenario || 'análise geral'}".

INSTRUÇÕES:
Retorne APENAS um JSON válido (sem markdown, sem backticks, sem explicação) com a seguinte estrutura:
{
  "fields": [
    {
      "key": "identificador-unico",
      "label": "Nome da cláusula ou campo",
      "value": "Resumo curto do conteúdo (máximo 60 caracteres)",
      "status": "Sem alteração | Alteração moderada | Alteração crítica | Novo",
      "category": "Escolha uma da lista: Dados gerais, Salariais, Benefícios, Jornada, Estabilidade, Férias, Rescisórias, PLR, Outros",
      "clause": "Texto completo da cláusula original do documento"
    }
  ]
}

Extraia entre 3 e 10 campos mais relevantes.
`;

    const systemMessage = `Você é um analisador de documentos do Pacto Ágil. Sua única função é extrair campos estruturados de documentos. 
Responda SEMPRE com JSON puro e válido, sem nenhum texto adicional, sem markdown, sem backticks.`;

    const result = await getGroqCompletion(prompt, systemMessage);

    if (!result) {
      return NextResponse.json({ fields: [] });
    }

    try {
      // Tentar parsear o JSON da resposta
      const cleaned = result.trim().replace(/^```json?\s*/, '').replace(/```\s*$/, '');
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch {
      console.error('[AI_ANALYZE] Resposta não é JSON válido:', result.substring(0, 200));
      return NextResponse.json({ fields: [], raw: result });
    }
  } catch (error: any) {
    console.error('[AI_ANALYZE_ERROR]', error);

    if (error.message?.includes('GROQ_API_KEY')) {
      return NextResponse.json({ error: 'Chave da API de IA não configurada.' }, { status: 500 });
    }

    return NextResponse.json({ error: 'Erro ao analisar documento: ' + (error.message || 'Erro desconhecido') }, { status: 500 });
  }
}
