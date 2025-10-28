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

export interface OptimizationResult {
  pieces: Piece[];
  efficiency: number;
  wasteArea: number;
  usedArea: number;
  unplacedPieces: Piece[];
}

export interface SlabDimensions {
  width: number;
  height: number;
}
