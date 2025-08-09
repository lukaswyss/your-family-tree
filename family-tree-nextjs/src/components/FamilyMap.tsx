'use client'

import { useMemo, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Individual } from '@/lib/gedcom-parser'
import { getCoordinatesFromCache, type Coordinates } from '@/lib/geocoding-client'

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface BirthplaceLocation {
  id: string
  name: string
  place: string
  lat: number
  lng: number
  individuals: Individual[]
}

interface FamilyMapProps {
  individuals: Individual[]
}

export function FamilyMap({ individuals }: FamilyMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [birthplaceLocations, setBirthplaceLocations] = useState<BirthplaceLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    // Use a small delay to ensure proper mounting
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Fix Leaflet marker icons
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet')
      
      // Delete the default icon to reset it
      delete L.Icon.Default.prototype._getIconUrl

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/marker-icon-2x.png',
        iconUrl: '/marker-icon.png',
        shadowUrl: '/marker-shadow.png',
      })
    }
  }, [])

  // Load geocoded locations
  useEffect(() => {
    const loadLocations = async () => {
      setLoading(true)
      const locationMap = new Map<string, BirthplaceLocation>()

      for (const individual of individuals) {
        if (individual.birth?.place) {
          const place = individual.birth.place
          const coords = await getCoordinatesFromCache(place)
          
          if (coords) {
            const key = `${coords.lat},${coords.lng}`
            
            if (locationMap.has(key)) {
              const existing = locationMap.get(key)!
              existing.individuals.push(individual)
            } else {
              locationMap.set(key, {
                id: key,
                name: place,
                place: place,
                lat: coords.lat,
                lng: coords.lng,
                individuals: [individual]
              })
            }
          }
        }
      }

      setBirthplaceLocations(Array.from(locationMap.values()))
      setLoading(false)
    }

    loadLocations()
  }, [individuals])

  const mapStats = useMemo(() => {
    const totalIndividuals = individuals.length
    const individualsWithBirthplaces = individuals.filter(i => i.birth?.place).length
    const mappedIndividuals = birthplaceLocations.reduce((sum, loc) => sum + loc.individuals.length, 0)
    const uniqueLocations = birthplaceLocations.length
    
    // Find unmapped places
    const unmappedPlaces = new Set<string>()
    individuals.forEach(individual => {
      if (individual.birth?.place) {
        const hasLocation = birthplaceLocations.some(loc => 
          loc.individuals.some(ind => ind.id === individual.id)
        )
        if (!hasLocation) {
          unmappedPlaces.add(individual.birth.place)
        }
      }
    })
    
    return {
      totalIndividuals,
      individualsWithBirthplaces,
      mappedIndividuals,
      uniqueLocations,
      unmappedPlaces: Array.from(unmappedPlaces)
    }
  }, [individuals, birthplaceLocations])

  // Calculate bounds for the map if we have locations
  const mapBounds = useMemo(() => {
    if (birthplaceLocations.length === 0) return null
    
    const lats = birthplaceLocations.map(loc => loc.lat)
    const lngs = birthplaceLocations.map(loc => loc.lng)
    
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ] as [[number, number], [number, number]]
  }, [birthplaceLocations])

  if (!isClient || loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
            <div className="h-6 bg-muted-foreground/20 rounded"></div>
          </div>
          <div className="bg-muted rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
            <div className="h-6 bg-muted-foreground/20 rounded"></div>
          </div>
          <div className="bg-muted rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
            <div className="h-6 bg-muted-foreground/20 rounded"></div>
          </div>
          <div className="bg-muted rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
            <div className="h-6 bg-muted-foreground/20 rounded"></div>
          </div>
        </div>
        <div className="w-full h-[600px] bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  if (birthplaceLocations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-sm font-medium text-muted-foreground">Total Individuals</p>
            <p className="text-2xl font-bold">{mapStats.totalIndividuals}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-sm font-medium text-muted-foreground">With Birthplaces</p>
            <p className="text-2xl font-bold">{mapStats.individualsWithBirthplaces}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-sm font-medium text-muted-foreground">Mapped</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-sm font-medium text-muted-foreground">Locations</p>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>
        <div className="w-full h-[600px] bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">No birthplace data with coordinates available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Use the <a href="/settings" className="text-primary hover:underline">Settings page</a> to geocode locations using the OpenWeatherMap API
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border">
          <p className="text-sm font-medium text-muted-foreground">Total Individuals</p>
          <p className="text-2xl font-bold">{mapStats.totalIndividuals}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <p className="text-sm font-medium text-muted-foreground">With Birthplaces</p>
          <p className="text-2xl font-bold">{mapStats.individualsWithBirthplaces}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <p className="text-sm font-medium text-muted-foreground">Mapped</p>
          <p className="text-2xl font-bold">{mapStats.mappedIndividuals}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <p className="text-sm font-medium text-muted-foreground">Locations</p>
          <p className="text-2xl font-bold">{mapStats.uniqueLocations}</p>
        </div>
      </div>
      
      {mounted && isClient && (
        <div className="w-full h-[600px] rounded-lg overflow-hidden border">
          <MapContainer
            bounds={mapBounds || undefined}
            center={mapBounds ? undefined : [20, 0]}
            zoom={mapBounds ? undefined : 2}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {birthplaceLocations.map((location) => (
              <Marker key={location.id} position={[location.lat, location.lng]}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-lg mb-2">{location.place}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {location.individuals.length} individual{location.individuals.length > 1 ? 's' : ''} born here
                    </p>
                    <div className="max-h-32 overflow-y-auto">
                      {location.individuals.map((individual) => (
                        <div key={individual.id} className="text-sm py-1 border-b border-border last:border-b-0">
                          <div className="font-medium">{individual.name.fullName}</div>
                          {individual.birth?.date && (
                            <div className="text-muted-foreground text-xs">
                              Born: {individual.birth.date}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
      
      {(!mounted || !isClient) && (
        <div className="w-full h-[600px] bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      )}
      
      {mapStats.unmappedPlaces.length > 0 && (
        <div className="bg-card rounded-lg p-4 border">
          <h3 className="font-semibold mb-2">Unmapped Birthplaces</h3>
          <p className="text-sm text-muted-foreground mb-3">
            These locations could not be mapped. Use the <a href="/settings" className="text-primary hover:underline">Settings page</a> to geocode them:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {mapStats.unmappedPlaces.map((place, index) => (
              <div key={index} className="text-sm bg-muted rounded px-2 py-1">
                {place}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 