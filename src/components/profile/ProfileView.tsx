import { Toaster, toast } from "sonner"
import { UserSettingsCard } from "./components/UserSettingsCard"
import { SectorManagementCard } from "./components/SectorManagementCard"
import { useProfileData } from "../../commands/useProfileData"

export function ProfileHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
      <p className="text-muted-foreground mt-2">
        Manage your account preferences and portfolio configuration.
      </p>
    </div>
  )
}

export function ProfileView() {
  const {
    profile,
    sectors,
    isLoadingProfile,
    isLoadingSectors,
    error,
    updateCurrency,
    addSector,
    updateSector,
    deleteSector
  } = useProfileData();

  if (error) {
    // Show error toast once if it's not already shown? 
    // Or just display an error banner.
    // For now, let's just log it or rely on the components to handle errors from actions.
    // But initial fetch error needs to be shown.
  }

  const handleCurrencyChange = async (currency: any) => {
    try {
      await updateCurrency(currency);
      toast.success("Currency updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update currency");
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <Toaster />
      <ProfileHeader />
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="grid gap-8">
        <UserSettingsCard 
            profile={profile} 
            isLoading={isLoadingProfile} 
            onCurrencyChange={handleCurrencyChange} 
        />
        
        <SectorManagementCard 
            sectors={sectors} 
            isLoading={isLoadingSectors} 
            onAdd={addSector} 
            onEdit={updateSector} 
            onDelete={deleteSector} 
        />
      </div>
    </div>
  )
}

