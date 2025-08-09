'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Loader2, MapPin, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'
import { useFamilyData } from '@/lib/use-family-data'
import { getCoordinatesFromCache, batchGeocode } from '@/lib/geocoding-client'

interface UnmappedData {
  totalPlaces: number
  unmappedPlaces: string[]
  unmappedCount: number
}

interface GeocodingResult {
  success: boolean
  geocoded: number
  failed: string[]
  total: number
}

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [unmappedData, setUnmappedData] = useState<UnmappedData | null>(null)
  const [geocodingResult, setGeocodingResult] = useState<GeocodingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const { data } = useFamilyData()

  // Compute unmapped places client-side from current data
  const recomputeUnmapped = useCallback(async () => {
    if (!data) {
      setUnmappedData({ totalPlaces: 0, unmappedPlaces: [], unmappedCount: 0 })
      return
    }
    const allPlaces = new Set<string>()
    data.individuals.forEach(ind => { if (ind.birth?.place) allPlaces.add(ind.birth.place) })
    const unmapped: string[] = []
    for (const place of Array.from(allPlaces)) {
      const coords = await getCoordinatesFromCache(place)
      if (!coords) unmapped.push(place)
    }
    setUnmappedData({ totalPlaces: allPlaces.size, unmappedPlaces: unmapped, unmappedCount: unmapped.length })
  }, [data])

  useEffect(() => {
    ;(async () => { await recomputeUnmapped() })()
  }, [recomputeUnmapped])

  const handleGeocodePlaces = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your OpenWeatherMap API key')
      return
    }

    if (!unmappedData || unmappedData.unmappedPlaces.length === 0) {
      setError('No unmapped places to geocode')
      return
    }

    setLoading(true)
    setError(null)
    setProgress(0)
    setGeocodingResult(null)

    try {
      const result = await batchGeocode(
        unmappedData.unmappedPlaces,
        apiKey.trim(),
        (current, total) => setProgress((current / total) * 100)
      )
      setGeocodingResult({ success: true, geocoded: result.success, failed: result.failed, total: unmappedData.unmappedPlaces.length })
      
      // Reload unmapped places to get updated count
      await recomputeUnmapped()
      
    } catch (error) {
      // Show a single clear error message (e.g., unauthorized API key) and abort
      setError(error instanceof Error ? error.message : 'Failed to geocode places')
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure geocoding settings for family tree locations
        </p>
      </div>

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            OpenWeatherMap API Configuration
          </CardTitle>
          <CardDescription>
            Enter your OpenWeatherMap API key to enable automatic geocoding of birthplace locations.
            Get your free API key at{' '}
            <a 
              href="https://openweathermap.org/api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              openweathermap.org
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your OpenWeatherMap API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Unmapped Places Status */}
      <Card>
        <CardHeader>
          <CardTitle>Geocoding Status</CardTitle>
          <CardDescription>
            Overview of birthplace locations and their mapping status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unmappedData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{unmappedData.totalPlaces}</div>
                  <div className="text-sm text-muted-foreground">Total Places</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {unmappedData.totalPlaces - unmappedData.unmappedCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Mapped</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {unmappedData.unmappedCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Unmapped</div>
                </div>
              </div>

              {unmappedData.unmappedCount > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Unmapped Places</h3>
                    <Button 
                      onClick={handleGeocodePlaces}
                      disabled={loading || !apiKey.trim()}
                      className="gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Geocoding...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4" />
                          Geocode Places
                        </>
                      )}
                    </Button>
                  </div>

                  {loading && (
                    <div className="space-y-2">
                      <Progress value={progress} className="w-full" />
                      <p className="text-sm text-muted-foreground text-center">
                        Geocoding places... {Math.round(progress)}%
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {unmappedData.unmappedPlaces.map((place, index) => (
                      <Badge key={index} variant="outline" className="justify-start">
                        {place}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading places...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Result */}
      {geocodingResult && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium text-green-800 dark:text-green-200">
                Geocoding completed successfully!
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                • {geocodingResult.geocoded} places geocoded successfully
                • {geocodingResult.failed.length} places failed to geocode
                • {geocodingResult.total} total places processed
              </div>
              {geocodingResult.failed.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium text-green-800 dark:text-green-200">
                    Failed places:
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {geocodingResult.failed.map((place, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {place}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Help & Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            • The geocoding system uses OpenWeatherMap's geocoding API to convert place names to coordinates
          </p>
          <p>
            • Coordinates are cached locally to avoid repeated API calls and improve performance
          </p>
          <p>
            • You can get a free API key by signing up at openweathermap.org (up to 1000 calls per day)
          </p>
          <p>
            • The system will automatically handle rate limiting and retry failed requests
          </p>
          <p>
            • Once geocoded, locations will appear on the family map visualization
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 