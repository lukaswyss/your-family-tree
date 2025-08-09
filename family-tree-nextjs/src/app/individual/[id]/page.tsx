'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Users, Heart, Baby, Crown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useFamilyData, getIndividualById, getFamilyMembers } from '@/lib/use-family-data'
import type { Individual } from '@/lib/gedcom-parser'

export default function IndividualPage() {
  const params = useParams()
  const id = params.id as string
  const { data, loading, error } = useFamilyData()
  const [individual, setIndividual] = useState<Individual | null>(null)
  const [familyMembers, setFamilyMembers] = useState<any>(null)

  useEffect(() => {
    if (data && id) {
      const person = getIndividualById(data.individuals, id)
      setIndividual(person || null)
      
      if (person) {
        const members = getFamilyMembers(data.individuals, data.families, id)
        setFamilyMembers(members)
      }
    }
  }, [data, id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading individual data...</p>
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

  if (!individual) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Individual not found</p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Family Tree
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{individual.name.fullName}</h1>
          <p className="text-muted-foreground">Individual Details</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{individual.name.fullName}</h3>
              {individual.name.given && individual.name.surname && (
                <p className="text-sm text-muted-foreground">
                  Given: {individual.name.given} • Surname: {individual.name.surname}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Badge variant={individual.alive ? "default" : "secondary"}>
                {individual.alive ? 'Living' : 'Deceased'}
              </Badge>
              
              {individual.sex && (
                <Badge variant="outline">
                  {individual.sex === 'M' ? 'Male' : 'Female'}
                </Badge>
              )}
              
              {individual.age && (
                <Badge variant="outline">
                  {individual.alive ? `Age ${individual.age}` : `Lived ${individual.age} years`}
                </Badge>
              )}
            </div>

            {/* Birth Information */}
            {individual.birth && (individual.birth.date || individual.birth.place) && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Birth
                </h4>
                <div className="ml-6 space-y-1">
                  {individual.birth.date && (
                    <p className="text-sm">{individual.birth.date}</p>
                  )}
                  {individual.birth.place && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {individual.birth.place}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Death Information */}
            {individual.death && (individual.death.date || individual.death.place) && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Death
                </h4>
                <div className="ml-6 space-y-1">
                  {individual.death.date && (
                    <p className="text-sm">{individual.death.date}</p>
                  )}
                  {individual.death.place && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {individual.death.place}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Burial Information */}
            {individual.burial && (individual.burial.date || individual.burial.place) && (
              <div className="space-y-2">
                <h4 className="font-medium">Burial</h4>
                <div className="ml-6 space-y-1">
                  {individual.burial.date && (
                    <p className="text-sm">{individual.burial.date}</p>
                  )}
                  {individual.burial.place && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {individual.burial.place}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Family Relationships */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Family Relationships
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Parents */}
            {familyMembers?.parents && familyMembers.parents.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Parents</h4>
                <div className="space-y-2">
                  {familyMembers.parents.map((parent: Individual) => (
                    <Link key={parent.id} href={`/individual/${parent.id}`}>
                      <div className="flex items-center gap-2 p-2 rounded border hover:bg-muted cursor-pointer">
                        <div>
                          <p className="font-medium text-sm">{parent.name.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {parent.birth?.date && `Born ${parent.birth.date}`}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Spouses */}
            {familyMembers?.spouses && familyMembers.spouses.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Spouse{familyMembers.spouses.length > 1 ? 's' : ''}
                </h4>
                <div className="space-y-2">
                  {familyMembers.spouses.map((spouse: Individual) => (
                    <Link key={spouse.id} href={`/individual/${spouse.id}`}>
                      <div className="flex items-center gap-2 p-2 rounded border hover:bg-muted cursor-pointer">
                        <div>
                          <p className="font-medium text-sm">{spouse.name.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {spouse.birth?.date && `Born ${spouse.birth.date}`}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Children */}
            {familyMembers?.children && familyMembers.children.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Baby className="w-4 h-4" />
                  Children ({familyMembers.children.length})
                </h4>
                <div className="space-y-2">
                  {familyMembers.children.map((child: Individual) => (
                    <Link key={child.id} href={`/individual/${child.id}`}>
                      <div className="flex items-center gap-2 p-2 rounded border hover:bg-muted cursor-pointer">
                        <div>
                          <p className="font-medium text-sm">{child.name.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {child.birth?.date && `Born ${child.birth.date}`}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No family relationships */}
            {(!familyMembers?.parents || familyMembers.parents.length === 0) &&
             (!familyMembers?.spouses || familyMembers.spouses.length === 0) &&
             (!familyMembers?.children || familyMembers.children.length === 0) && (
              <p className="text-muted-foreground text-sm">No family relationships found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ID Information */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Individual ID: <code className="bg-muted px-1 rounded">{individual.id}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 