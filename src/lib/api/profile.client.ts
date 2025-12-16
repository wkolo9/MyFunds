import type {
  ProfileDTO,
  SectorDTO,
  Currency,
  SectorsListDTO
} from '../../types';
import { handleResponse } from '../utils/api.utils';

export const profileApi = {
  getProfile: async (): Promise<ProfileDTO> => {
    const response = await fetch('/api/profile');
    return handleResponse<ProfileDTO>(response);
  },

  updateCurrency: async (preferred_currency: Currency): Promise<ProfileDTO> => {
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferred_currency }),
    });
    return handleResponse<ProfileDTO>(response);
  },

  getSectors: async (): Promise<{ sectors: SectorDTO[]; total: number }> => {
    const response = await fetch('/api/sectors');
    return handleResponse<SectorsListDTO>(response);
  },

  addSector: async (name: string): Promise<SectorDTO> => {
    const response = await fetch('/api/sectors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    return handleResponse<SectorDTO>(response);
  },

  updateSector: async (id: string, name: string): Promise<SectorDTO> => {
    const response = await fetch(`/api/sectors/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    return handleResponse<SectorDTO>(response);
  },

  deleteSector: async (id: string): Promise<void> => {
    const response = await fetch(`/api/sectors/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },
};
