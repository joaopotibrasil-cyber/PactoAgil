import { NextResponse } from 'next/server';
import { getGroqCompletion } from '@/lib/ai/groq';

export async function POST(req: Request) {
  try {
    const { scenario, categories, fields } = await req.json();

    if (!scenario) {
      return NextResponse.json({ error: 'Cenário é obrigatório' }, { status: 400 });
    }

    // Construção do Prompt para o Groq
    const prompt = `
Com base nos seguintes parâmetros de negociação coletiva de trabalho, gere uma minuta profissional, equilibrada e detalhada.
A minuta deve estar em Português (Brasil), seguindo a estrutura padrão de Acordos Coletivos de Trabalho (ACT).

PARÂMETROS DA NEGOCIAÇÃO:
1. Cenário: ${scenario}
2. Categorias da Minuta: ${categories?.join(', ') || 'Não especificadas'}
3. Campos e Cláusulas Extraídas:
${fields?.map((f: any) => `- ${f.label}: ${f.value} (Histórico/Origem: ${f.clause})`).join('\n') || 'Nenhum campo adicional fornecido'}

OBJETIVO:
Gere o texto completo da minuta, começando por um título formal e identificando as partes (Empresa e Sindicato representativo). 
Utilize uma linguagem jurídica clara mas moderna. Divida em Cláusulas numeradas seguindo a ordem das categorias fornecidas.

Foque nos pontos críticos solicitados nos "Campos Extraídos", garantindo que as alterações propostas estejam bem redigidas.
    `;

    const systemMessage = "Você é um consultor jurídico sênior do Pacto Ágil, especialista em direito do trabalho e redação de instrumentos normativos de negociação coletiva. Seu objetivo é redigir minutas profissionais, impecáveis e estrategicamente bem estruturadas.";

    const generatedText = await getGroqCompletion(prompt, systemMessage);

    return NextResponse.json({ text: generatedText });
  } catch (error: any) {
    console.error('Error generating draft:', error);
    return NextResponse.json({ error: 'Erro ao gerar minuta: ' + error.message }, { status: 500 });
  }
}
