import { apiRequest } from './api';
import { ROUTES } from '@/constants/routes';

export interface Negotiation {
  id: string;
  nomeEmpresa: string;
  titulo?: string;
  instrumento: string;
  status: string;
  dataBase?: string;
  createdAt: string;
}

export const negotiationService = {
  async list(): Promise<Negotiation[]> {
    return apiRequest<Negotiation[]>(ROUTES.API.NEGOTIATIONS);
  },

  async get(id: string): Promise<Negotiation> {
    return apiRequest<Negotiation>(`${ROUTES.API.NEGOTIATIONS}?id=${id}`);
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`${ROUTES.API.NEGOTIATIONS}?id=${id}`, {
      method: 'DELETE',
    });
  },

  async save(id: string | null, data: Partial<Negotiation>): Promise<Negotiation> {
    const url = id ? `${ROUTES.API.NEGOTIATIONS}?id=${id}` : ROUTES.API.NEGOTIATIONS;
    return apiRequest<Negotiation>(url, {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(data),
    });
  }
};
