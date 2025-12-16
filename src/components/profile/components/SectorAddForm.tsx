import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"

interface SectorAddFormProps {
  isSubmitting: boolean;
  existingNames: string[];
  onSubmit: (name: string) => void;
}

export function SectorAddForm({ isSubmitting, existingNames, onSubmit }: SectorAddFormProps) {
  const [name, setName] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedName = name.trim()
    
    if (!trimmedName) {
      setError("Name cannot be empty")
      return
    }

    if (existingNames.some(n => n.toLowerCase() === trimmedName.toLowerCase())) {
      setError("Sector with this name already exists")
      return
    }

    setError(null)
    onSubmit(trimmedName)
    setName("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Label htmlFor="new-sector">Add New Sector</Label>
      <div className="flex w-full items-start gap-2">
        <div className="flex-1 space-y-1">
          <Input
            id="new-sector"
            placeholder="Sector name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError(null)
            }}
            disabled={isSubmitting}
            className={error ? "border-red-500" : ""}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <Button type="submit" size="icon" disabled={isSubmitting || !name.trim()}>
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add sector</span>
        </Button>
      </div>
    </form>
  )
}

