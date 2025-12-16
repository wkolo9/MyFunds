import { useState, useCallback, useEffect } from 'react';
import type { ProfileDTO, SectorDTO, Currency } from '../types';
import { profileApi } from '../lib/api/profile.client';

export interface ProfileViewState {
  profile: ProfileDTO | null;
  sectors: SectorDTO[];
  isLoadingProfile: boolean;
  isLoadingSectors: boolean;
  error: string | null;
}

export function useProfileData() {
  const [state, setState] = useState<ProfileViewState>({
    profile: null,
    sectors: [],
    isLoadingProfile: true, // Start loading immediately
    isLoadingSectors: true,
    error: null,
  });

  const refreshData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingProfile: true, isLoadingSectors: true, error: null }));
    try {
      const [profile, sectorsData] = await Promise.all([
        profileApi.getProfile(),
        profileApi.getSectors()
      ]);
      setState(prev => ({
        ...prev,
        profile,
        sectors: sectorsData.sectors,
        isLoadingProfile: false,
        isLoadingSectors: false
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to fetch data',
        isLoadingProfile: false,
        isLoadingSectors: false
      }));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const updateCurrency = async (currency: Currency) => {
    try {
      const updatedProfile = await profileApi.updateCurrency(currency);
      setState(prev => ({ ...prev, profile: updatedProfile }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message || 'Failed to update currency' }));
      throw err;
    }
  };

  const addSector = async (name: string) => {
    try {
      const newSector = await profileApi.addSector(name);
      setState(prev => ({ ...prev, sectors: [...prev.sectors, newSector] }));
    } catch (err: any) {
      if (err.status === 409) {
        throw new Error('Sector with this name already exists');
      }
      throw err;
    }
  };

  const updateSector = async (id: string, name: string) => {
    try {
      const updatedSector = await profileApi.updateSector(id, name);
      setState(prev => ({
        ...prev,
        sectors: prev.sectors.map(s => s.id === id ? updatedSector : s)
      }));
    } catch (err: any) {
       if (err.status === 409) {
        throw new Error('Sector with this name already exists');
      }
      throw err;
    }
  };

  const deleteSector = async (id: string) => {
    try {
      await profileApi.deleteSector(id);
      setState(prev => ({
        ...prev,
        sectors: prev.sectors.filter(s => s.id !== id)
      }));
    } catch (err: any) {
      throw err;
    }
  };

  return {
    ...state,
    refreshData,
    updateCurrency,
    addSector,
    updateSector,
    deleteSector
  };
}

