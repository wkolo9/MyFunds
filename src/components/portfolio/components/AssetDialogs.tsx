import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { SectorSelect } from './SectorSelect';
import { sectorApi } from '../../../lib/api/sector.client';
import type { CreatePortfolioAssetCommand, PortfolioAssetDTO } from '../../../types';

const assetSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required').max(10, 'Ticker is too long'),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Quantity must be a positive number',
  }),
  sector_id: z.string().nullable(),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePortfolioAssetCommand) => Promise<void>;
}

export function AddAssetDialog({ open, onOpenChange, onSubmit }: AddAssetDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      ticker: '',
      quantity: '',
      sector_id: null,
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const handleFormSubmit = async (data: AssetFormData) => {
    try {
      await onSubmit({
        ticker: data.ticker.toUpperCase(),
        quantity: data.quantity,
        sector_id: data.sector_id,
      });
      onOpenChange(false);
    } catch (error: any) {
      if (error.message?.includes('Invalid ticker symbol')) {
        setError('ticker', {
          type: 'manual',
          message: 'Invalid ticker symbol. Please verify the ticker.',
        });
        toast.error(`Invalid ticker symbol: ${data.ticker}`);
      }
    }
  };

  const createSector = async (name: string) => {
    const newSector = await sectorApi.addSector(name);
    return newSector.id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-test-id="add-asset-dialog">
        <DialogHeader>
          <DialogTitle>Add Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="ticker">Ticker</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ticker format should match 'finance.yahoo.com' search. i.e. BTC-USD, XTB.WA</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="ticker"
              placeholder="e.g. AAPL"
              {...register('ticker')}
              onChange={(e) => setValue('ticker', e.target.value.toUpperCase())}
              data-test-id="asset-ticker-input"
              aria-invalid={!!errors.ticker}
            />
            {errors.ticker && (
              <p className="text-sm text-destructive">{errors.ticker.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              step="any"
              placeholder="e.g. 10"
              {...register('quantity')}
              data-test-id="asset-quantity-input"
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Sector</Label>
            <SectorSelect
              value={watch('sector_id')}
              onChange={(val) => setValue('sector_id', val)}
              onNewSector={createSector}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} data-test-id="submit-asset-button">
              {isSubmitting ? 'Adding...' : 'Add Asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditAssetDialogProps {
  asset: PortfolioAssetDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: Partial<AssetFormData>) => Promise<void>;
}

export function EditAssetDialog({ asset, open, onOpenChange, onSubmit }: EditAssetDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
  });

  useEffect(() => {
    if (open && asset) {
      reset({
        ticker: asset.ticker,
        quantity: asset.quantity,
        sector_id: asset.sector_id,
      });
    }
  }, [open, asset, reset]);

  const handleFormSubmit = async (data: AssetFormData) => {
    if (!asset) return;
    
    await onSubmit(asset.id, {
        // Ticker usually isn't editable in simple edit forms, but schema has it. 
        // For update, we usually just update quantity/sector
        quantity: data.quantity,
        sector_id: data.sector_id
    });
    onOpenChange(false);
  };

  const createSector = async (name: string) => {
    const newSector = await sectorApi.addSector(name);
    return newSector.id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-ticker">Ticker</Label>
            <Input
              id="edit-ticker"
              value={asset?.ticker}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-quantity">Quantity</Label>
            <Input
              id="edit-quantity"
              type="number"
              step="any"
              {...register('quantity')}
            />
             {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Sector</Label>
            <SectorSelect
              value={watch('sector_id')}
              onChange={(val) => setValue('sector_id', val)}
              onNewSector={createSector}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

