import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is missing');
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Função utilitária para completar chat com o Groq (Ex: para o Gerador de Minutas)
 */
export async function getGroqCompletion(prompt: string, systemMessage?: string) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemMessage || "Você é o assistente inteligente do Pacto Ágil, especialista em negociações coletivas de trabalho.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "llama-3.3-70b-versatile", // Modelo recomendado pela Groq
  });

  return completion.choices[0].message.content;
}
