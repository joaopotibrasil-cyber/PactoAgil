/**
 * Base genérica para chamadas de API do sistema Pacto Ágil.
 * Centraliza o tratamento de erros e a inclusão de credenciais.
 */
export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const defaultOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro na requisição: ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error: any) {
    console.error(`[API Service Error] ${url}:`, error.message);
    throw error;
  }
}
