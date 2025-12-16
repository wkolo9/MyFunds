import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table"
import { SectorRow } from "./SectorRow"
import type { SectorDTO } from "@/types"

interface SectorListProps {
  sectors: SectorDTO[];
  existingNames: string[];
  onSave: (id: string, newName: string) => Promise<void>;
  onDeleteRequest: (id: string) => void;
}

export function SectorList({ sectors, existingNames, onSave, onDeleteRequest }: SectorListProps) {
  if (sectors.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No sectors found. Add your first sector above.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sector Name</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sectors.map((sector) => (
            <SectorRow
              key={sector.id}
              sector={sector}
              existingNames={existingNames}
              onSave={onSave}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

