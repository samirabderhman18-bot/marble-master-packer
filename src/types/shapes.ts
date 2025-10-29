export type ShapeType = 'rectangle' | 'l-left' | 'l-right' | 't-shape' | 'circle' | 'triangle' | 'custom';

export interface Point {
  x: number;
  y: number;
}

export interface Piece {
  id: string;
  type: ShapeType;
  width: number;
  height: number;
  x?: number;
  y?: number;
  rotated?: boolean;
  priority?: number; // Higher priority pieces placed first
  grainDirection?: 'horizontal' | 'vertical' | 'none';
  cuttingOrder?: number;
  
  // For L-shapes
  cutWidth?: number;
  cutHeight?: number;
  cutPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  
  // For T-shapes
  topWidth?: number;
  stemWidth?: number;
  
  // For circles
  radius?: number;
  
  // For triangles
  base?: number;
  triangleHeight?: number;
  
  // For custom shapes
  points?: Point[];
  
  color?: string;
}

export type OptimizationGoal = 'waste-reduction' | 'production-speed' | 'aesthetic-matching' | 'cost-efficiency';

export interface DefectZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FreeRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OptimizationResult {
  pieces: Piece[];
  efficiency: number;
  wasteArea: number;
  usedArea: number;
  unplacedPieces: Piece[];
  cuttingSequence: number[];
  combinationsTested: number;
  freeRectangles: FreeRectangle[];
}

export interface SlabDimensions {
  width: number;
  height: number;
  margin?: number;
  minSpacing?: number;
  grainDirection?: 'horizontal' | 'vertical' | 'none';
  defects?: DefectZone[];
}
