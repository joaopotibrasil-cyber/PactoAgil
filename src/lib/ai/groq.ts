import Groq from 'groq-sdk';

let _groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!_groq) {
    if (!import.meta.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is missing from environment variables');
    }
    _groq = new Groq({
      apiKey: import.meta.env.GROQ_API_KEY,
    });
  }
  return _groq;
}

export { getGroqClient as groq };

/**
 * Função utilitária para completar chat com o Groq
 */
export async function getGroqCompletion(
  prompt: string, 
  systemMessage?: string, 
  model: string = "llama-3.3-70b-versatile"
) {
  const client = getGroqClient();
  const completion = await client.chat.completions.create({
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
    model: model,
    temperature: 0.7,
    max_tokens: 4096,
  });

  return completion.choices[0]?.message.content || "";
}
