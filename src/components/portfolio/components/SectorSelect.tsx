import React, { useState, useEffect } from 'react';
import { Plus, X, Check, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '../../ui/select';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { sectorApi } from '../../../lib/api/sector.client';
import type { SectorDTO } from '../../../types';
import { toast } from 'sonner';

interface SectorSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  onNewSector: (name: string) => Promise<string>;
}

export function SectorSelect({ value, onChange, onNewSector }: SectorSelectProps) {
  const [sectors, setSectors] = useState<SectorDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSectors();
  }, []);

  const loadSectors = async () => {
    try {
      setLoading(true);
      const data = await sectorApi.getSectors();
      setSectors(data.sectors);
    } catch (error) {
      console.error('Failed to load sectors', error);
      toast.error('Failed to load sectors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newSectorName.trim()) return;

    try {
      setIsSubmitting(true);
      const newId = await onNewSector(newSectorName);
      
      // Refresh list to include new sector
      await loadSectors();
      
      // Select the new sector
      onChange(newId);
      
      // Reset mode
      setIsCreating(false);
      setNewSectorName('');
    } catch (error) {
      console.error('Failed to create sector', error);
      // Toast should be handled by onNewSector or parent usually, but here onNewSector returns ID, so parent might not handle UI error if it throws.
      // Assuming parent handles error logic or we catch it here.
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCreating) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={newSectorName}
          onChange={(e) => setNewSectorName(e.target.value)}
          placeholder="New sector name"
          disabled={isSubmitting}
          className="h-9"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault(); // Prevent form submission if inside form
              handleCreate();
            }
            if (e.key === 'Escape') {
              setIsCreating(false);
              setNewSectorName('');
            }
          }}
        />
        <Button 
          type="button" 
          size="sm" 
          onClick={handleCreate}
          disabled={!newSectorName.trim() || isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setIsCreating(false);
            setNewSectorName('');
          }}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Select
      value={value === null ? "null" : value}
      onValueChange={(val) => {
        if (val === "create_new") {
          setIsCreating(true);
        } else if (val === "null") {
          onChange(null);
        } else {
          onChange(val);
        }
      }}
      disabled={loading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? "Loading..." : "Select sector"} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
            {/* Treat 'null' as "Other" or "Unassigned" */}
            <SelectItem value="null">Other</SelectItem>
            {sectors.map((sector) => (
            <SelectItem key={sector.id} value={sector.id}>
                {sector.name}
            </SelectItem>
            ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectItem value="create_new" className="font-medium text-primary cursor-pointer">
            <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create new sector
            </div>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

