import type {
  SectorDTO,
  SectorsListDTO
} from '../../types';
import { handleResponse } from '../utils/api.utils';
import { getAuthHeaders } from '../utils/client-auth';

export const sectorApi = {
  getSectors: async (): Promise<SectorsListDTO> => {
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
  }
};

