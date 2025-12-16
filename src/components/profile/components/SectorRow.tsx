import * as React from "react"
import { Pencil, Trash2, Check, X } from "lucide-react"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { TableCell, TableRow } from "../../ui/table"
import type { SectorDTO } from "../../../types"

interface SectorRowProps {
  sector: SectorDTO;
  existingNames: string[];
  onSave: (id: string, newName: string) => Promise<void>;
  onDeleteRequest: (id: string) => void;
}

export function SectorRow({ sector, existingNames, onSave, onDeleteRequest }: SectorRowProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [tempName, setTempName] = React.useState(sector.name)
  const [error, setError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const handleSave = async () => {
    const trimmedName = tempName.trim()
    
    if (!trimmedName) {
      setError("Name cannot be empty")
      return
    }

    if (
      trimmedName.toLowerCase() !== sector.name.toLowerCase() &&
      existingNames.some(n => n.toLowerCase() === trimmedName.toLowerCase())
    ) {
      setError("Sector with this name already exists")
      return
    }

    try {
      setIsSaving(true)
      await onSave(sector.id, trimmedName)
      setIsEditing(false)
      setError(null)
    } catch (e) {
      // Error handling is done in parent, but we can catch here if needed
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setTempName(sector.name)
    setError(null)
  }

  if (isEditing) {
    return (
      <TableRow>
        <TableCell colSpan={2}>
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <Input
                value={tempName}
                onChange={(e) => {
                  setTempName(e.target.value)
                  if (error) setError(null)
                }}
                disabled={isSaving}
                className={error ? "border-red-500" : ""}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave()
                  if (e.key === "Escape") handleCancel()
                }}
                autoFocus
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <Button size="icon" variant="ghost" onClick={handleSave} disabled={isSaving}>
              <Check className="h-4 w-4 text-green-500" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancel} disabled={isSaving}>
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{sector.name}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDeleteRequest(sector.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

