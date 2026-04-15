import { apiRequest } from './api';
import { ROUTES } from '@/constants/routes';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  companyName?: string;
  role?: string;
  avatarUrl?: string;
}

export const profileService = {
  async get(): Promise<UserProfile> {
    return apiRequest<UserProfile>(ROUTES.API.PROFILE.ROOT);
  },

  async update(data: Partial<UserProfile>): Promise<UserProfile> {
    return apiRequest<UserProfile>(ROUTES.API.PROFILE.UPDATE, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async getPortalUrl(): Promise<{ url: string }> {
    return apiRequest<{ url: string }>(ROUTES.API.PORTAL, {
      method: 'POST'
    });
  }
};
