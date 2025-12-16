import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Label } from "../../ui/label";
import { CurrencySelector } from "./CurrencySelector";
import type { ProfileDTO, Currency } from "@/types";
import { useState } from "react";

interface UserSettingsCardProps {
  profile: ProfileDTO | null;
  isLoading: boolean;
  onCurrencyChange: (currency: Currency) => Promise<void>;
}

export function UserSettingsCard({ profile, isLoading, onCurrencyChange }: UserSettingsCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCurrencyChange = async (currency: Currency) => {
    setIsUpdating(true);
    try {
      await onCurrencyChange(currency);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ustawienia konta</CardTitle>
        <CardDescription>Zarządzaj preferencjami swojego profilu.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label>Identyfikator użytkownika</Label>
            <div className="text-sm font-mono text-muted-foreground p-2 bg-muted rounded-md break-all">
                {isLoading ? "Ładowanie..." : profile?.user_id}
            </div>
        </div>
        <div className="space-y-2">
          <Label>Preferowana waluta</Label>
          <CurrencySelector
            value={profile?.preferred_currency || "USD"}
            disabled={isLoading || isUpdating}
            onChange={handleCurrencyChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}

