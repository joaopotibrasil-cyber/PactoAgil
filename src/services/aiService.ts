import { apiRequest } from './api';
import { ROUTES } from '@/constants/routes';

export interface AIResponse {
  result: string;
  analysis?: any;
}

export const aiService = {
  async analyze(content: string, context?: any): Promise<AIResponse> {
    return apiRequest<AIResponse>(ROUTES.API.AI.ANALYZE, {
      method: 'POST',
      body: JSON.stringify({ content, context }),
    });
  },

  async generate(prompt: string, options?: any): Promise<AIResponse> {
    return apiRequest<AIResponse>(ROUTES.API.AI.GENERATE, {
      method: 'POST',
      body: JSON.stringify({ prompt, ...options }),
    });
  }
};
