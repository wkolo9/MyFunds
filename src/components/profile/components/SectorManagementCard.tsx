import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import { SectorAddForm } from "./SectorAddForm"
import { SectorList } from "./SectorList"
import { DeleteSectorDialog } from "./DeleteSectorDialog"
import type { SectorDTO } from "../../../types"
import { toast } from "sonner"

interface SectorManagementCardProps {
  sectors: SectorDTO[];
  isLoading: boolean;
  onAdd: (name: string) => Promise<void>;
  onEdit: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function SectorManagementCard({
  sectors,
  isLoading,
  onAdd,
  onEdit,
  onDelete
}: SectorManagementCardProps) {
  const [sectorToDelete, setSectorToDelete] = useState<SectorDTO | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Extract existing names for validation
  const existingNames = sectors.map(s => s.name);

  const handleAdd = async (name: string) => {
    setIsAdding(true);
    try {
      await onAdd(name);
      toast.success("Sector added successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to add sector");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = async (id: string, name: string) => {
    try {
      await onEdit(id, name);
      toast.success("Sector name updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update sector");
      throw err; // Re-throw so the row component knows it failed
    }
  };

  const handleDeleteRequest = (id: string) => {
    const sector = sectors.find(s => s.id === id);
    if (sector) {
      setSectorToDelete(sector);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!sectorToDelete) return;
    
    try {
      await onDelete(sectorToDelete.id);
      toast.success("Sector deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete sector");
    } finally {
      setSectorToDelete(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Sectors</CardTitle>
        <CardDescription>
          Configure categories for your portfolio assets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <SectorAddForm 
          isSubmitting={isAdding || isLoading} 
          existingNames={existingNames}
          onSubmit={handleAdd}
        />
        
        <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Current Sectors</h3>
            {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading sectors...</div>
            ) : (
                <SectorList 
                    sectors={sectors} 
                    existingNames={existingNames}
                    onSave={handleEdit} 
                    onDeleteRequest={handleDeleteRequest} 
                />
            )}
        </div>

        <DeleteSectorDialog 
          open={!!sectorToDelete} 
          sectorName={sectorToDelete?.name || ""} 
          onConfirm={handleDeleteConfirm}
          onCancel={() => setSectorToDelete(null)}
        />
      </CardContent>
    </Card>
  )
}

