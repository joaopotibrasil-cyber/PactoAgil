import { GoogleGenerativeAI } from "@google/generative-ai";

const getGenAI = () => {
  const apiKey = import.meta.env.GOOGLE_AI_API_KEY || "";
  return new GoogleGenerativeAI(apiKey);
};

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = import.meta.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not configured. Please set the environment variable.');
  }

  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Erro ao gerar embedding:", error);
    throw error;
  }
}
