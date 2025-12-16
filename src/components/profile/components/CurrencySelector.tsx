import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select"
import type { Currency } from "@/types"

interface CurrencySelectorProps {
  value: Currency;
  disabled: boolean;
  onChange: (value: Currency) => void;
}

export function CurrencySelector({ value, disabled, onChange }: CurrencySelectorProps) {
  return (
    <Select value={value} onValueChange={(val) => onChange(val as Currency)} disabled={disabled}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="USD">USD </SelectItem>
        <SelectItem value="PLN">PLN </SelectItem>
      </SelectContent>
    </Select>
  )
}

