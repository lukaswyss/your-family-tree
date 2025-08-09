'use client'

import { useCallback, useEffect, useState } from 'react'
import { parseGedcomFile, type Individual, type Family, type ParsedGedcomData } from './gedcom-parser'

export function useFamilyData() {
  const [data, setData] = useState<ParsedGedcomData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFromLocalStorage = useCallback(() => {
    try {
      setLoading(true)
      setError(null)
      if (typeof window === 'undefined') {
        setData(null)
        return
      }
      const gedcomContent = localStorage.getItem('gedcomContent')
      if (!gedcomContent) {
        setData(null)
        return
      }
      const parsedData = parseGedcomFile(gedcomContent)
      if (!parsedData || !parsedData.individuals || !parsedData.families) {
        throw new Error('Invalid GEDCOM data in local storage')
      }
      setData(parsedData)
    } catch (err) {
      console.error('Error loading GEDCOM from localStorage:', err)
      setError(err instanceof Error ? err.message : 'Failed to load GEDCOM from local storage')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFromLocalStorage()
  }, [loadFromLocalStorage])

  const refresh = useCallback(() => {
    loadFromLocalStorage()
  }, [loadFromLocalStorage])

  const clear = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gedcomContent')
    }
    loadFromLocalStorage()
  }, [loadFromLocalStorage])

  return { data, loading, error, refresh, clear }
}

// Helper functions for working with the data
export function getIndividualById(individuals: Individual[], id: string): Individual | undefined {
  return individuals.find(individual => individual.id === id)
}

export function getIndividualsByName(individuals: Individual[], searchTerm: string): Individual[] {
  const term = searchTerm.toLowerCase()
  return individuals.filter(individual => 
    individual.name.fullName.toLowerCase().includes(term) ||
    individual.name.given?.toLowerCase().includes(term) ||
    individual.name.surname?.toLowerCase().includes(term)
  )
}

export function getFamilyMembers(individuals: Individual[], families: Family[], individualId: string) {
  const individual = getIndividualById(individuals, individualId)
  if (!individual) return null

  const parents = individual.parents?.map(parentFamilyId => {
    const family = families.find(f => f.id === parentFamilyId)
    if (!family) return []
    const parentIds = [family.husband, family.wife].filter(Boolean) as string[]
    return parentIds.map(id => getIndividualById(individuals, id)).filter(Boolean) as Individual[]
  }).flat() || []

  const spouses = individual.spouse?.map(spouseId => 
    getIndividualById(individuals, spouseId)
  ).filter(Boolean) as Individual[] || []

  const children = individual.children?.map(childId => 
    getIndividualById(individuals, childId)
  ).filter(Boolean) as Individual[] || []

  return {
    individual,
    parents,
    spouses,
    children
  }
} 