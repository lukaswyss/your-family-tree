declare module 'basicprimitives' {
  export const PageFitMode: {
    None: number;
    PageWidth: number;
    PageHeight: number;
    FitToPage: number;
    SelectionOnly: number;
  };
  
  export const OrientationType: {
    Top: number;
    Bottom: number;
    Left: number;
    Right: number;
  };
  
  export const Colors: {
    RoyalBlue: string;
    [key: string]: string;
  };
  
  export const Enabled: {
    True: number;
    False: number;
    Auto: number;
  };
}

declare module 'basicprimitivesreact' {
  import { ComponentType } from 'react';
  
  export interface FamDiagramProps {
    centerOnCursor?: boolean;
    config: any;
  }
  
  export const FamDiagram: ComponentType<FamDiagramProps>;
} 