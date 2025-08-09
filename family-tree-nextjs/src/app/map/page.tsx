'use client'

import { useFamilyData } from '@/lib/use-family-data'
import { FamilyMap } from '@/components/FamilyMap'

export default function MapPage() {
  const { data, loading, error } = useFamilyData()

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family Map</h1>
          <p className="text-muted-foreground">Explore birth and death locations of family members</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading family tree data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family Map</h1>
          <p className="text-muted-foreground">Explore birth and death locations of family members</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive mb-2">Error loading family data</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family Map</h1>
          <p className="text-muted-foreground">
            Explore birth and death locations of family members
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">No family data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Family Map</h1>
        <p className="text-muted-foreground">
          Explore birth and death locations of family members across the world
        </p>
      </div>

      <FamilyMap individuals={data.individuals} />
    </div>
  )
} 