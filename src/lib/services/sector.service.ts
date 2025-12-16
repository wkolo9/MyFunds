import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { SectorDTO, SectorsListDTO, CreateSectorCommand, UpdateSectorCommand } from '../../types';
import { ValidationError, NotFoundError, DatabaseError } from '../utils/error.utils';

/**
 * Sector Service - handles sector-related database operations
 */
export class SectorService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves all sectors for a user
   */
  async listSectors(userId: string): Promise<SectorsListDTO> {
    if (!userId) {
      throw new ValidationError('User ID is required', 'user_id');
    }

    const { data, error, count } = await this.supabase
      .from('sectors')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      throw new DatabaseError(error.message);
    }

    return {
      sectors: (data || []) as SectorDTO[],
      total: count || 0,
    };
  }

  /**
   * Creates a new sector
   * Validations:
   * - Max 32 sectors per user
   * - Name must be unique for the user
   */
  async createSector(userId: string, command: CreateSectorCommand): Promise<SectorDTO> {
    if (!userId) {
      throw new ValidationError('User ID is required', 'user_id');
    }

    // 1. Check max sectors limit
    const { count, error: countError } = await this.supabase
      .from('sectors')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      throw new DatabaseError(countError.message);
    }

    if (count !== null && count >= 32) {
      throw new ValidationError('Maximum limit of 32 sectors reached', 'name');
    }

    // 2. Check name uniqueness
    const { data: existing, error: distinctError } = await this.supabase
      .from('sectors')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', command.name) // Case insensitive check
      .maybeSingle();

    if (distinctError) {
      throw new DatabaseError(distinctError.message);
    }

    if (existing) {
      throw new ValidationError(`Sector with name "${command.name}" already exists`, 'name');
    }

    // 3. Create sector
    const { data, error } = await this.supabase
      .from('sectors')
      .insert({
        user_id: userId,
        name: command.name,
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(error.message);
    }

    return data as SectorDTO;
  }

  /**
   * Updates an existing sector
   * Validations:
   * - Name must be unique (excluding current sector)
   */
  async updateSector(userId: string, sectorId: string, command: UpdateSectorCommand): Promise<SectorDTO> {
    if (!userId) throw new ValidationError('User ID is required', 'user_id');
    if (!sectorId) throw new ValidationError('Sector ID is required', 'id');

    // 1. Check if sector exists
    const { data: current, error: findError } = await this.supabase
      .from('sectors')
      .select('id')
      .eq('id', sectorId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (findError) throw new DatabaseError(findError.message);
    if (!current) throw new NotFoundError('Sector');

    // 2. Check name uniqueness (excluding current sector)
    const { data: duplicate, error: distinctError } = await this.supabase
      .from('sectors')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', command.name)
      .neq('id', sectorId)
      .maybeSingle();

    if (distinctError) throw new DatabaseError(distinctError.message);
    
    if (duplicate) {
      throw new ValidationError(`Sector with name "${command.name}" already exists`, 'name');
    }

    // 3. Update sector
    const { data, error } = await this.supabase
      .from('sectors')
      .update({
        name: command.name,
      })
      .eq('id', sectorId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(error.message);
    }

    return data as SectorDTO;
  }

  /**
   * Deletes a sector
   */
  async deleteSector(userId: string, sectorId: string): Promise<void> {
    if (!userId) throw new ValidationError('User ID is required', 'user_id');
    if (!sectorId) throw new ValidationError('Sector ID is required', 'id');

    // 1. Check if sector exists
     const { data: current, error: findError } = await this.supabase
      .from('sectors')
      .select('id')
      .eq('id', sectorId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (findError) throw new DatabaseError(findError.message);
    if (!current) throw new NotFoundError('Sector');

    // 2. Delete sector
    const { error } = await this.supabase
      .from('sectors')
      .delete()
      .eq('id', sectorId)
      .eq('user_id', userId);

    if (error) {
      throw new DatabaseError(error.message);
    }
  }
}

/**
 * Factory function to create SectorService instance
 */
export function createSectorService(supabase: SupabaseClient<Database>): SectorService {
  return new SectorService(supabase);
}

