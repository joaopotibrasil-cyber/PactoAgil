import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase/astro';
import { getGroqCompletion } from '@/lib/ai/groq';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { data: { user }, error: authError } = await supabase(cookies).auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
    }

    const { scenario, categories, fields, documentContent } = await request.json();

    if (!scenario) {
      return new Response(JSON.stringify({ error: 'Cenário é obrigatório' }), { status: 400 });
    }

    const prompt = `
Com base nos seguintes parâmetros de negociação coletiva de trabalho, gere uma minuta profissional, equilibrada e detalhada.
A minuta deve estar em Português (Brasil), seguindo a estrutura padrão de Acordos Coletivos de Trabalho (ACT).

PARÂMETROS DA NEGOCIAÇÃO:
1. Cenário: ${scenario}
2. Categorias da Minuta (na ordem desejada): ${categories?.join(', ') || 'Não especificadas'}
3. Campos e Cláusulas Extraídas:
${fields?.map((f: any) => `- ${f.label}: ${f.value} (Contexto: ${f.clause})`).join('\n') || 'Nenhum campo adicional fornecido'}

${documentContent ? `4. CONTEÚDO DO DOCUMENTO IMPORTADO (usar como base/referência):
---
${documentContent.substring(0, 6000)}
---` : ''}

INSTRUÇÕES DE FORMATO:
- Comece com "MINUTA DE ACORDO COLETIVO DE TRABALHO" como título.
- Inclua identificação das partes (use termos genéricos para empresa e sindicato).
- Numere cada cláusula como "Cláusula 1ª -", "Cláusula 2ª -", etc.
- Siga a ordem das categorias fornecidas para organizar as cláusulas.
- Use linguagem jurídica clara e moderna.
- Inclua cláusula de vigência e disposições gerais ao final.
- Não inclua comentários ou explicações, apenas o texto da minuta.
    `;

    const systemMessage = `Você é um consultor jurídico sênior do Pacto Ágil, especialista em direito do trabalho e redação de instrumentos normativos de negociação coletiva (ACTs e CCTs). 
Seu objetivo é redigir minutas profissionais, impecáveis e estrategicamente bem estruturadas.
Sempre responda APENAS com o texto da minuta, sem comentários adicionais, explicações ou markdown.`;

    const generatedText = await getGroqCompletion(prompt, systemMessage);

    return new Response(JSON.stringify({ text: generatedText }), { status: 200 });
  } catch (error: any) {
    console.error('[AI_GENERATE_ERROR]', error);

    if (error.message?.includes('GROQ_API_KEY')) {
      return new Response(JSON.stringify({ error: 'Chave da API de IA não configurada. Configure GROQ_API_KEY no .env' }), { status: 500 });
    }

    return new Response(JSON.stringify({ error: 'Erro ao gerar minuta: ' + (error.message || 'Erro desconhecido') }), { status: 500 });
  }
};
