'use client'

import { useCallback, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useFamilyData, getIndividualsByName } from '@/lib/use-family-data'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { clearGeocodingCacheLocal } from '@/lib/geocoding-client'

export default function HomePage() {
  const [search, setSearch] = useState('')
  const { data, loading, error, refresh, clear } = useFamilyData()

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      if (typeof window !== 'undefined') {
        localStorage.setItem('gedcomContent', text)
      }
      refresh()
    } catch (e) {
      console.error('Failed to read GEDCOM file:', e)
    } finally {
      event.target.value = ''
    }
  }, [refresh])

  const handleClearAll = useCallback(() => {
    clear()
    clearGeocodingCacheLocal()
  }, [clear])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading family tree data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading family data</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Upload your GEDCOM file</h2>
          <p className="text-muted-foreground">Select a .ged file to explore your family tree privately in your browser.</p>
          <div className="flex items-center justify-center">
            <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted">
              <input type="file" accept=".ged,.GED" className="hidden" onChange={handleFileUpload} />
              <span>Choose .ged file</span>
            </label>
          </div>
        </div>
      </div>
    )
  }

  const filteredIndividuals = search === ''
    ? data.individuals
    : getIndividualsByName(data.individuals, search)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Individuals</h1>
        <p className="text-muted-foreground">Browse and search through your family tree members</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted">
            <input type="file" accept=".ged,.GED" className="hidden" onChange={handleFileUpload} />
            <span>Upload new .ged</span>
          </label>
          <Button variant="outline" onClick={handleClearAll}>Clear data</Button>
        </div>
        <Input
          placeholder="Search individuals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <p className="text-sm text-muted-foreground">
          Total: <span className="font-medium">{filteredIndividuals.length}</span> individuals
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredIndividuals.map((individual) => (
          <Link key={individual.id} href={`/individual/${individual.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{individual.name.fullName}</CardTitle>
                <CardDescription>
                  {individual.birth?.date && `Born: ${individual.birth.date}`}
                  {individual.birth?.place && ` in ${individual.birth.place}`}
                  {individual.death?.date && (
                    <>
                      <br />
                      Died: {individual.death.date}
                      {individual.death.place && ` in ${individual.death.place}`}
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    individual.alive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {individual.alive ? 'Living' : 'Deceased'}
                  </span>
                  {individual.age && (
                    <span className="text-muted-foreground">
                      {individual.alive ? `Age ${individual.age}` : `Lived ${individual.age} years`}
                    </span>
                  )}
                </div>
                {individual.sex && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Gender: {individual.sex === 'M' ? 'Male' : 'Female'}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredIndividuals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No individuals found matching your search.</p>
        </div>
      )}
    </div>
  )
} 