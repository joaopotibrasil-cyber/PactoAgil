import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Interface para uma cláusula com vetor
 */
export interface ClauseWithEmbedding {
  id: string;
  content: string;
  metadata: any;
  similarity?: number;
}

/**
 * Busca por cláusulas similares no Supabase Vector
 * NOTA: Esta função exige que a extensão 'vector' e a função 'match_clausulas' 
 * estejam habilitadas no banco de dados.
 */
export async function searchSimilarClauses(
  embedding: number[],
  matchThreshold = 0.5,
  matchCount = 5
): Promise<ClauseWithEmbedding[]> {
  try {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase.rpc('match_clausulas', {
      query_embedding: `[${embedding.join(',')}]`,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error("Erro na busca vetorial:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Erro na busca vetorial:", error);
    return [];
  }
}

/**
 * Salva uma nova cláusula com seu respectivo embedding
 */
export async function storeClause(
  content: string,
  embedding: number[],
  metadata: any
) {
  try {
    const supabase = createAdminClient();
    
    const { error } = await supabase
      .from('clausulas')
      .insert({
        content,
        embedding: `[${embedding.join(',')}]`,
        metadata: JSON.stringify(metadata),
      });

    if (error) {
      console.error("Erro ao salvar cláusula:", error);
      throw error;
    }
  } catch (error) {
    console.error("Erro ao salvar cláusula:", error);
    throw error;
  }
}
