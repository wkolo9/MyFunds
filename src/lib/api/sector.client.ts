import type {
  SectorDTO,
  SectorsListDTO
} from '../../types';
import { handleResponse } from '../utils/api.utils';

export const sectorApi = {
  getSectors: async (): Promise<SectorsListDTO> => {
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
  }
};

