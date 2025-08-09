'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useFamilyData, getIndividualById } from '@/lib/use-family-data'
import Tree from 'react-d3-tree'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Individual } from '@/lib/gedcom-parser'
import Link from 'next/link'

// Define interfaces for react-d3-tree compatible with the library's types
interface NodeDatum {
  name: string;
  individualData?: Individual;
  relationship?: 'direct' | 'spouse' | 'family-unit' | 'couple';
  children?: NodeDatum[];
  __rd3t?: any;
}

// Define prop interface for custom node component
interface CustomNodeProps {
  nodeDatum: NodeDatum;
  onNodeClick: (datum: NodeDatum) => void;
}

// Default empty tree data that matches the expected RawNodeDatum structure
const DEFAULT_TREE_DATA = {
  name: 'Family Tree',
  children: []
};

// Custom node component for the tree
const CustomNode = ({ nodeDatum, onNodeClick }: CustomNodeProps) => {
  const individual = nodeDatum.individualData
  
  // Hide the connector nodes (family unit nodes)
  if (nodeDatum.relationship === 'family-unit' || nodeDatum.relationship === 'couple') {
    return (
      <g>
        {/* Invisible connector node */}
        <circle r="1" fill="transparent" />
      </g>
    )
  }
  
  // Choose colors based on gender
  const fillColor = individual?.sex === 'F' 
    ? '#f9cdc0' // Female background
    : '#d2e6f7' // Male background
    
  const strokeColor = individual?.sex === 'F'
    ? '#b55a44' // Female border
    : '#2b6ca4' // Male border
  
  const strokeWidth = individual?.alive ? 2 : 1
  const strokeDash = individual?.alive ? 'none' : '3,3'

  // Show years if available
  const birthYear = individual?.birth?.date ? individual.birth.date.slice(-4) : ''
  const deathYear = individual?.death?.date ? individual.death.date.slice(-4) : ''
  const yearsText = birthYear && deathYear 
    ? `${birthYear}-${deathYear}`
    : birthYear 
      ? `${birthYear}-` 
      : deathYear 
        ? `-${deathYear}` 
        : ''

  return (
    <g onClick={() => onNodeClick(nodeDatum)}>
      <rect
        width="120"
        height="80"
        x="-60"
        y="-40"
        rx="5"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDash}
      />
      <text
        fill="black"
        x="0"
        y="-20"
        textAnchor="middle"
        style={{ fontSize: '13px', fontWeight: 'bold' }}
      >
        {nodeDatum.name}
      </text>
      {yearsText && (
        <text fill="#333" x="0" y="0" textAnchor="middle" style={{ fontSize: '12px' }}>
          {yearsText}
        </text>
      )}
      {individual?.age && (
        <text fill="#333" x="0" y="20" textAnchor="middle" style={{ fontSize: '11px' }}>
          {individual.alive ? `Age: ${individual.age}` : ''}
        </text>
      )}
    </g>
  )
}

// Convert the individual data to the format required by react-d3-tree
function convertToTreeData(individual: Individual, individuals: Individual[], visited = new Set<string>()): NodeDatum | null {
  if (!individual || visited.has(individual.id)) {
    return null
  }

  visited.add(individual.id)
  
  // Create node for this individual
  const individualNode: NodeDatum = {
    name: individual.name.fullName,
    individualData: individual,
    relationship: 'direct',
    children: []
  }
  
  // Find spouse(s)
  const spouses = individual.spouse
    ?.map(spouseId => getIndividualById(individuals, spouseId))
    .filter((spouse): spouse is Individual => Boolean(spouse)) || []
  
  // Find children
  const children = individual.children
    ?.map(childId => getIndividualById(individuals, childId))
    .filter((child): child is Individual => Boolean(child)) || []

  // Process children
  const childNodes = children.map(child => {
    if (!visited.has(child.id)) {
      return convertToTreeData(child, individuals, new Set(Array.from(visited)))
    }
    return null
  }).filter(Boolean) as NodeDatum[]
  
  // If there's a spouse, add them as a sibling at the same level as the main individual
  if (spouses.length > 0) {
    // For simplicity, just take the first spouse
    const spouse = spouses[0]
    if (spouse && !visited.has(spouse.id)) {
      visited.add(spouse.id)
      
      // Create parent node that will be invisible
      const parentNode: NodeDatum = {
        name: 'Family',
        relationship: 'family-unit',
        children: childNodes
      }
      
      // Return a structure that represents both individuals side by side
      return {
        name: 'Couple',
        relationship: 'couple',
        children: [
          individualNode, 
          {
            name: spouse.name.fullName,
            individualData: spouse,
            relationship: 'spouse'
          },
          parentNode
        ]
      }
    }
  }
  
  // No spouse, just add children directly
  individualNode.children = childNodes
  return individualNode
}

export default function TreePage() {
  const { data, loading, error } = useFamilyData()
  const [searchTerm, setSearchTerm] = useState('')
  const [rootIndividual, setRootIndividual] = useState<Individual | null>(null)
  const [treeData, setTreeData] = useState<NodeDatum | null>(null)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [initialZoom, setInitialZoom] = useState(0.6)
  const treeContainerRef = useRef<HTMLDivElement>(null)

  // Resize handler for tree container
  useEffect(() => {
    if (treeContainerRef.current) {
      const dimensions = treeContainerRef.current.getBoundingClientRect()
      setTranslate({
        x: dimensions.width / 2,
        y: 80 // Leave space for the search controls
      })
      
      // Adjust zoom based on whether viewing full tree or individual
      setInitialZoom(rootIndividual ? 0.6 : 0.3)
    }
  }, [rootIndividual, treeContainerRef])

  // Update tree data when rootIndividual changes
  useEffect(() => {
    if (data) {
      if (rootIndividual) {
        // Generate tree for specific individual
        const treeDataObj = convertToTreeData(rootIndividual, data.individuals)
        setTreeData(treeDataObj)
      } else {
        // Generate full family tree when no specific individual is selected
        setTreeData(null) // Will trigger fullTreeData generation in render
      }
    }
  }, [rootIndividual, data])

  const handleNodeClick = useCallback((nodeDatum: NodeDatum) => {
    // Navigate to individual page when clicked
    if (nodeDatum.individualData) {
      window.open(`/individual/${nodeDatum.individualData.id}`, '_blank')
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family Tree</h1>
          <p className="text-muted-foreground">
            Explore the family tree structure and relationships
          </p>
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
          <h1 className="text-3xl font-bold tracking-tight">Family Tree</h1>
          <p className="text-muted-foreground">
            Explore the family tree structure and relationships
          </p>
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
          <h1 className="text-3xl font-bold tracking-tight">Family Tree</h1>
          <p className="text-muted-foreground">
            Explore the family tree structure and relationships
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">No family data available</p>
        </div>
      </div>
    )
  }

  // Find oldest individuals (those without parents) for potential root nodes
  const rootCandidates = data.individuals.filter(individual => 
    !individual.parents || individual.parents.length === 0
  ).sort((a, b) => {
    // Sort by birth date if available
    if (a.birth?.date && b.birth?.date) {
      return new Date(a.birth.date).getTime() - new Date(b.birth.date).getTime()
    }
    return a.name.fullName.localeCompare(b.name.fullName)
  })

  const filteredIndividuals = searchTerm 
    ? data.individuals.filter(individual =>
        individual.name.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : rootCandidates

  // Prepare data for the full family tree
  const buildFullFamilyTree = (): NodeDatum => {
    if (!data || !data.individuals.length) return DEFAULT_TREE_DATA
    
    // Start with all root candidates
    const forestRoots = rootCandidates.map(root => 
      convertToTreeData(root, data.individuals, new Set())
    ).filter(Boolean) as NodeDatum[]
    
    // If we have multiple roots, create a virtual root
    if (forestRoots.length > 1) {
      return {
        name: "Family Tree",
        relationship: 'family-unit',
        children: forestRoots
      }
    } else if (forestRoots.length === 1) {
      return forestRoots[0]
    }
    
    // Fallback - use the first individual as root
    const fallbackTree = convertToTreeData(data.individuals[0], data.individuals, new Set())
    return fallbackTree || DEFAULT_TREE_DATA
  }
  
  // Only build the full tree if no rootIndividual is selected
  const fullTreeData = !rootIndividual ? buildFullFamilyTree() : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Family Tree</h1>
        <p className="text-muted-foreground">
          Explore the family tree structure and relationships using an interactive 3D visualization
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-4">
          <Input
            placeholder="Search for a person to focus the tree..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          {rootIndividual && (
            <Button
              variant="outline"
              onClick={() => {
                setRootIndividual(null)
                setSearchTerm('')
              }}
            >
              Show Full Tree
            </Button>
          )}
        </div>

        {!rootIndividual && searchTerm && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Search Results</h3>
            <p className="text-sm text-muted-foreground">
              Click on a person to focus the tree on their family branch
            </p>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {filteredIndividuals.slice(0, 12).map((individual) => (
                <Card 
                  key={individual.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setRootIndividual(individual)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{individual.name.fullName}</CardTitle>
                    <CardDescription className="text-xs">
                      {individual.birth?.date && `Born: ${individual.birth.date}`}
                      {individual.children && ` • ${individual.children.length} children`}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <div 
        className="border rounded-lg bg-muted/30"
        style={{ height: '70vh', width: '100%' }}
        ref={treeContainerRef}
      >
        <Tree
          data={treeData || fullTreeData || DEFAULT_TREE_DATA}
          orientation="vertical"
          translate={translate}
          nodeSize={{ x: 140, y: 120 }}
          separation={{
            siblings: 1.1,
            nonSiblings: 1.3
          }}
          pathClassFunc={() => 'path-link'}
          pathFunc="elbow"
          renderCustomNodeElement={(rd3tProps) => 
            CustomNode({ ...rd3tProps, onNodeClick: handleNodeClick })
          }
          zoom={initialZoom}
          collapsible={false}
        />
      </div>
      
      <style jsx global>{`
        .path-link {
          fill: none;
          stroke: #ccc;
          stroke-width: 1.5px;
        }
      `}</style>
      
      <div className="text-xs text-muted-foreground text-center">
        <p>
          Navigate: Drag to pan, use mouse wheel to zoom, click on a person to view their profile
        </p>
        <p className="mt-1">
          <span className="inline-block w-3 h-3 rounded-full bg-[#d2e6f7] border border-[#2b6ca4] mr-1"></span> Male
          <span className="ml-3 inline-block w-3 h-3 rounded-full bg-[#f9cdc0] border border-[#b55a44] mr-1"></span> Female
          <span className="ml-3 inline-block w-3 h-3 rounded-full border border-dashed border-gray-400 mr-1"></span> Deceased
        </p>
      </div>
    </div>
  )
} 