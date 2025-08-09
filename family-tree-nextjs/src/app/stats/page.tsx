'use client'

import { useMemo } from 'react'
import { useFamilyData } from '@/lib/use-family-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Individual } from '@/lib/gedcom-parser'
import moment from 'moment'

interface StatsData {
  totalIndividuals: number
  livingIndividuals: number
  deceasedIndividuals: number
  maleCount: number
  femaleCount: number
  unknownGenderCount: number
  averageAge: number
  oldestPerson: Individual | null
  youngestLiving: Individual | null
  totalFamilies: number
  mostChildren: { individual: Individual; count: number } | null
  birthDecades: Record<string, number>
  commonSurnames: Array<{ name: string; count: number }>
  birthplaces: Array<{ place: string; count: number }>
  averageLifespan: number
}

function calculateStats(individuals: Individual[], families: any[]): StatsData {
  const living = individuals.filter(i => i.alive)
  const deceased = individuals.filter(i => !i.alive)
  const withAge = individuals.filter(i => i.age !== undefined)
  
  // Gender counts
  const maleCount = individuals.filter(i => i.sex === 'M').length
  const femaleCount = individuals.filter(i => i.sex === 'F').length
  const unknownGenderCount = individuals.filter(i => !i.sex).length

  // Age calculations
  const averageAge = withAge.length > 0 
    ? withAge.reduce((sum, i) => sum + (i.age || 0), 0) / withAge.length 
    : 0

  // Oldest person (living or deceased)
  const oldestPerson = individuals.reduce((oldest, current) => {
    if (!oldest) return current
    if ((current.age || 0) > (oldest.age || 0)) return current
    return oldest
  }, null as Individual | null)

  // Youngest living person
  const youngestLiving = living.reduce((youngest, current) => {
    if (!youngest) return current
    if ((current.age || Infinity) < (youngest.age || Infinity)) return current
    return youngest
  }, null as Individual | null)

  // Most children
  const mostChildren = individuals.reduce((max, current) => {
    const childCount = current.children?.length || 0
    if (!max || childCount > max.count) {
      return { individual: current, count: childCount }
    }
    return max
  }, null as { individual: Individual; count: number } | null)

  // Birth decades
  const birthDecades: Record<string, number> = {}
  individuals.forEach(individual => {
    if (individual.birth?.date) {
      const year = moment(individual.birth.date, [
        'MMM DD, YYYY',
        'D MMM YYYY',
        'MMM YYYY',
        'YYYY'
      ], true).year()
      
      if (!isNaN(year)) {
        const decade = Math.floor(year / 10) * 10
        const decadeKey = `${decade}s`
        birthDecades[decadeKey] = (birthDecades[decadeKey] || 0) + 1
      }
    }
  })

  // Common surnames
  const surnameCount: Record<string, number> = {}
  individuals.forEach(individual => {
    const surname = individual.name.surname
    if (surname) {
      surnameCount[surname] = (surnameCount[surname] || 0) + 1
    }
  })
  
  const commonSurnames = Object.entries(surnameCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Birth places
  const placeCount: Record<string, number> = {}
  individuals.forEach(individual => {
    const place = individual.birth?.place
    if (place) {
      placeCount[place] = (placeCount[place] || 0) + 1
    }
  })
  
  const birthplaces = Object.entries(placeCount)
    .map(([place, count]) => ({ place, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Average lifespan (for deceased individuals)
  const deceasedWithAge = deceased.filter(i => i.age !== undefined)
  const averageLifespan = deceasedWithAge.length > 0
    ? deceasedWithAge.reduce((sum, i) => sum + (i.age || 0), 0) / deceasedWithAge.length
    : 0

  return {
    totalIndividuals: individuals.length,
    livingIndividuals: living.length,
    deceasedIndividuals: deceased.length,
    maleCount,
    femaleCount,
    unknownGenderCount,
    averageAge: Math.round(averageAge),
    oldestPerson,
    youngestLiving,
    totalFamilies: families.length,
    mostChildren,
    birthDecades,
    commonSurnames,
    birthplaces,
    averageLifespan: Math.round(averageLifespan)
  }
}

export default function StatsPage() {
  const { data, loading, error } = useFamilyData()

  const stats = useMemo(() => {
    if (!data) return null
    return calculateStats(data.individuals, data.families)
  }, [data])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family Statistics</h1>
          <p className="text-muted-foreground">Insights and statistics about your family tree</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading family statistics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family Statistics</h1>
          <p className="text-muted-foreground">Insights and statistics about your family tree</p>
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

  if (!data || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family Statistics</h1>
          <p className="text-muted-foreground">Insights and statistics about your family tree</p>
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
        <h1 className="text-3xl font-bold tracking-tight">Family Statistics</h1>
        <p className="text-muted-foreground">Insights and statistics about your family tree</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Individuals</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIndividuals}</div>
            <p className="text-xs text-muted-foreground">
              Family members recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Living Members</CardTitle>
            <span className="text-2xl">💚</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.livingIndividuals}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.livingIndividuals / stats.totalIndividuals) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Families</CardTitle>
            <span className="text-2xl">👨‍👩‍👧‍👦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFamilies}</div>
            <p className="text-xs text-muted-foreground">
              Family units recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Age</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageAge} years</div>
            <p className="text-xs text-muted-foreground">
              All recorded individuals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gender Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Gender Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.maleCount}</div>
              <p className="text-sm text-muted-foreground">Male</p>
              <p className="text-xs text-muted-foreground">
                {((stats.maleCount / stats.totalIndividuals) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">{stats.femaleCount}</div>
              <p className="text-sm text-muted-foreground">Female</p>
              <p className="text-xs text-muted-foreground">
                {((stats.femaleCount / stats.totalIndividuals) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.unknownGenderCount}</div>
              <p className="text-sm text-muted-foreground">Unknown</p>
              <p className="text-xs text-muted-foreground">
                {((stats.unknownGenderCount / stats.totalIndividuals) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notable Records */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notable Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.oldestPerson && (
              <div>
                <p className="text-sm font-medium">Oldest Person (Ever)</p>
                <p className="text-lg">{stats.oldestPerson.name.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.oldestPerson.age} years old
                  {stats.oldestPerson.alive ? ' (living)' : ''}
                </p>
              </div>
            )}
            
            {stats.youngestLiving && (
              <div>
                <p className="text-sm font-medium">Youngest Living</p>
                <p className="text-lg">{stats.youngestLiving.name.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.youngestLiving.age} years old
                </p>
              </div>
            )}

            {stats.mostChildren && (
              <div>
                <p className="text-sm font-medium">Most Children</p>
                <p className="text-lg">{stats.mostChildren.individual.name.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.mostChildren.count} children
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium">Average Lifespan</p>
              <p className="text-lg">{stats.averageLifespan} years</p>
              <p className="text-sm text-muted-foreground">
                For deceased family members
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Common Surnames</CardTitle>
            <CardDescription>Most frequent family names</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.commonSurnames.slice(0, 8).map((surname, index) => (
                <div key={surname.name} className="flex justify-between items-center">
                  <span className="text-sm">{index + 1}. {surname.name}</span>
                  <span className="text-sm font-medium">{surname.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Birth Decades */}
      <Card>
        <CardHeader>
          <CardTitle>Births by Decade</CardTitle>
          <CardDescription>Distribution of births across time periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4 lg:grid-cols-6">
            {Object.entries(stats.birthDecades)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([decade, count]) => (
                <div key={decade} className="text-center p-2 border rounded">
                  <div className="font-medium">{decade}</div>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">births</div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Birthplaces */}
      <Card>
        <CardHeader>
          <CardTitle>Top Birthplaces</CardTitle>
          <CardDescription>Most common places of birth</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.birthplaces.slice(0, 10).map((place, index) => (
              <div key={place.place} className="flex justify-between items-center">
                <span className="text-sm">{index + 1}. {place.place}</span>
                <span className="text-sm font-medium">{place.count} births</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 