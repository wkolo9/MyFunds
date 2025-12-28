import type {
  ProfileDTO,
  SectorDTO,
  Currency,
  SectorsListDTO
} from '../../types';
import { handleResponse } from '../utils/api.utils';
import { getAuthHeaders } from '../utils/client-auth';

export const profileApi = {
  getProfile: async (): Promise<ProfileDTO> => {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/profile', {
      headers
    });
    return handleResponse<ProfileDTO>(response);
  },

  updateCurrency: async (preferred_currency: Currency): Promise<ProfileDTO> => {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({ preferred_currency }),
    });
    return handleResponse<ProfileDTO>(response);
  },

  getSectors: async (): Promise<{ sectors: SectorDTO[]; total: number }> => {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/sectors', {
      headers
    });
    return handleResponse<SectorsListDTO>(response);
  },

  addSector: async (name: string): Promise<SectorDTO> => {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/sectors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({ name }),
    });
    return handleResponse<SectorDTO>(response);
  },

  updateSector: async (id: string, name: string): Promise<SectorDTO> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/sectors/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({ name }),
    });
    return handleResponse<SectorDTO>(response);
  },

  deleteSector: async (id: string): Promise<void> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/sectors/${id}`, {
      method: 'DELETE',
      headers
    });
    return handleResponse<void>(response);
  },
};
