import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePortfolio } from './hooks/usePortfolio';
import { SummaryCard } from './components/SummaryCard';
import { AssetTable } from './components/AssetTable';
import { SectorAllocationChart } from './components/SectorAllocationChart';
import { AddAssetDialog, EditAssetDialog } from './components/AssetDialogs';
import { DeleteAssetAlert } from './components/DeleteAssetAlert';
import { Button } from '../ui/button';
import type { PortfolioAssetDTO } from '../../types';

export function PortfolioDashboard() {
  const {
    assets,
    summary,
    currency,
    isLoading,
    isRefreshing,
    setCurrency,
    addAsset,
    editAsset,
    removeAsset,
  } = usePortfolio();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<PortfolioAssetDTO | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<PortfolioAssetDTO | null>(null);

  // Sorting assets by value descending for better initial view, though table handles its own sorting now
  const sortedAssets = [...assets].sort((a, b) => b.current_value - a.current_value);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 space-y-6">
      <div className="flex flex-col space-y-2 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Portfolio</h1>
        <p className="text-muted-foreground">
          Manage your assets and view your portfolio performance.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-1">
            <SummaryCard 
              totalValue={summary?.total_value || 0}
              currency={currency}
              onCurrencyChange={setCurrency}
              isLoading={isLoading || isRefreshing}
            />
          </div>
          <div className="col-span-1 md:col-span-1 lg:col-span-3">
               <SectorAllocationChart 
                  data={summary?.sectors || []} 
                  currency={currency} 
               />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Assets</h2>
              <Button onClick={() => setIsAddOpen(true)} data-test-id="add-asset-button">
                  <Plus className="mr-2 h-4 w-4" /> Add Asset
              </Button>
          </div>
          
          <AssetTable 
              assets={sortedAssets} 
              currency={currency}
              onEdit={(asset) => setEditingAsset(asset)}
              onDelete={(asset) => setDeletingAsset(asset)}
          />
        </div>

        <AddAssetDialog 
          open={isAddOpen} 
          onOpenChange={setIsAddOpen} 
          onSubmit={addAsset} 
        />

        <EditAssetDialog 
          asset={editingAsset}
          open={!!editingAsset}
          onOpenChange={(open) => !open && setEditingAsset(null)}
          onSubmit={editAsset}
        />

        <DeleteAssetAlert 
          asset={deletingAsset}
          open={!!deletingAsset}
          onOpenChange={(open) => !open && setDeletingAsset(null)}
          onConfirm={async (id) => {
              await removeAsset(id);
              setDeletingAsset(null);
          }}
        />
      </div>
    </div>
  );
}
