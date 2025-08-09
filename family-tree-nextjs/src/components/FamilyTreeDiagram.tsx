'use client'

import React from 'react';
import { Individual } from '@/lib/gedcom-parser';

interface FamilyTreeDiagramProps {
  individuals: Individual[];
  showGroupTitle?: boolean;
  orientation?: number;
  showScale?: boolean;
  initScale?: number;
  height?: string;
  width?: string;
  pageFitMode?: number;
}

interface TreeNode {
  id: string;
  name: string;
  birth?: string;
  death?: string;
  sex: string;
  alive: boolean;
  children: TreeNode[];
  level: number;
}

export function FamilyTreeDiagram({
  individuals,
  height = '70vh',
  width = '100%',
}: FamilyTreeDiagramProps) {
  return (
    <div className="space-y-4">
      <div 
        className="border rounded-lg flex items-center justify-center bg-gray-50" 
        style={{ height, width }}
      >
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-4">Family Tree Diagram</h3>
          <p className="text-gray-600 mb-4">
            Interactive family tree diagram is temporarily unavailable.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Showing {individuals.length} family members. Please use the traditional tree view above for full functionality.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
            {individuals.slice(0, 12).map((individual) => (
              <div key={individual.id} className="p-3 border rounded-lg bg-white">
                <div className="font-medium text-sm">{individual.name.fullName}</div>
                {individual.birth?.date && (
                  <div className="text-xs text-gray-500">Born: {individual.birth.date}</div>
                )}
                {individual.death?.date && (
                  <div className="text-xs text-gray-500">Died: {individual.death.date}</div>
                )}
                <div className={`text-xs mt-1 px-2 py-1 rounded ${
                  individual.alive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {individual.alive ? 'Living' : 'Deceased'}
                </div>
              </div>
            ))}
          </div>
          {individuals.length > 12 && (
            <p className="text-sm text-gray-500 mt-4">
              ...and {individuals.length - 12} more family members
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 