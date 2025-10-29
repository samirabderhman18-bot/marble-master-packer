import { Piece, SlabDimensions, OptimizationResult, OptimizationGoal } from '@/types/shapes';

interface FreeRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PlacementAttempt {
  piece: Piece;
  rect: FreeRectangle;
  rotated: boolean;
  score: number;
}

const PIECE_COLORS = [
  'hsl(210, 85%, 70%)',   // Vibrant blue
  'hsl(145, 75%, 65%)',   // Vibrant green
  'hsl(340, 80%, 70%)',   // Vibrant pink
  'hsl(45, 95%, 65%)',    // Vibrant yellow
  'hsl(270, 75%, 70%)',   // Vibrant purple
  'hsl(25, 90%, 65%)',    // Vibrant orange
  'hsl(195, 80%, 65%)',   // Vibrant cyan
  'hsl(15, 85%, 68%)',    // Vibrant coral
];

function getPieceArea(piece: Piece): number {
  switch (piece.type) {
    case 'l-left':
    case 'l-right':
      if (piece.cutWidth && piece.cutHeight) {
        return piece.width * piece.height - piece.cutWidth * piece.cutHeight;
      }
      return piece.width * piece.height;
    case 'circle':
      return piece.radius ? Math.PI * piece.radius * piece.radius : piece.width * piece.height;
    case 'triangle':
      return (piece.width * piece.height) / 2;
    default:
      return piece.width * piece.height;
  }
}

function doesIntersectDefect(piece: Piece, x: number, y: number, slab: SlabDimensions): boolean {
  if (!slab.defects || slab.defects.length === 0) return false;
  
  for (const defect of slab.defects) {
    if (!(x + piece.width < defect.x || 
          x > defect.x + defect.width ||
          y + piece.height < defect.y || 
          y > defect.y + defect.height)) {
      return true;
    }
  }
  return false;
}

function isGrainAligned(piece: Piece, rotated: boolean, slab: SlabDimensions): boolean {
  if (slab.grainDirection === 'none' || !piece.grainDirection || piece.grainDirection === 'none') {
    return true;
  }
  
  const pieceOrientation = rotated ? 
    (piece.grainDirection === 'horizontal' ? 'vertical' : 'horizontal') : 
    piece.grainDirection;
    
  return pieceOrientation === slab.grainDirection;
}

function calculatePlacementScore(
  piece: Piece, 
  rect: FreeRectangle, 
  rotated: boolean, 
  goal: OptimizationGoal,
  slab: SlabDimensions
): number {
  const area = getPieceArea(piece);
  const wastedSpace = (rect.width * rect.height) - area;
  const priority = piece.priority || 1;
  const grainBonus = isGrainAligned(piece, rotated, slab) ? 100 : 0;
  
  switch (goal) {
    case 'waste-reduction':
      return -wastedSpace + (priority * 1000) + grainBonus;
    case 'production-speed':
      return -(rect.x + rect.y) + (priority * 1000) + grainBonus;
    case 'aesthetic-matching':
      return grainBonus * 10 + (priority * 1000) - wastedSpace;
    case 'cost-efficiency':
      return (area * priority) - wastedSpace + grainBonus;
    default:
      return -wastedSpace + (priority * 1000);
  }
}

function tryPackingStrategy(
  pieces: Piece[], 
  slab: SlabDimensions,
  sortFn: (a: Piece, b: Piece) => number,
  goal: OptimizationGoal
): OptimizationResult {
  const margin = slab.margin || 1;
  const minSpacing = slab.minSpacing || 0.5;
  
  const freeRects: FreeRectangle[] = [{
    x: margin,
    y: margin,
    width: slab.width - 2 * margin,
    height: slab.height - 2 * margin,
  }];
  
  const placedPieces: Piece[] = [];
  const unplacedPieces: Piece[] = [];
  const sortedPieces = [...pieces].sort(sortFn);
  let cuttingOrder = 1;
  
  for (const piece of sortedPieces) {
    let placed = false;
    let bestPlacement: PlacementAttempt | null = null;
    
    for (const rect of freeRects) {
      const placements: PlacementAttempt[] = [];
      
      // Try normal orientation
      if (piece.width + minSpacing <= rect.width && piece.height + minSpacing <= rect.height) {
        if (!doesIntersectDefect(piece, rect.x, rect.y, slab)) {
          placements.push({
            piece,
            rect,
            rotated: false,
            score: calculatePlacementScore(piece, rect, false, goal, slab)
          });
        }
      }
      
      // Try rotated orientation
      if (piece.height + minSpacing <= rect.width && piece.width + minSpacing <= rect.height) {
        if (!doesIntersectDefect(piece, rect.x, rect.y, slab)) {
          placements.push({
            piece,
            rect,
            rotated: true,
            score: calculatePlacementScore(piece, rect, true, goal, slab)
          });
        }
      }
      
      // Find best placement
      for (const placement of placements) {
        if (!bestPlacement || placement.score > bestPlacement.score) {
          bestPlacement = placement;
        }
      }
    }
    
    if (bestPlacement) {
      const { rect, rotated } = bestPlacement;
      const width = rotated ? piece.height : piece.width;
      const height = rotated ? piece.width : piece.height;
      
      const newPiece: Piece = {
        ...piece,
        x: rect.x,
        y: rect.y,
        width,
        height,
        rotated,
        cuttingOrder: cuttingOrder++,
        color: PIECE_COLORS[(placedPieces.length) % PIECE_COLORS.length],
      };
      
      placedPieces.push(newPiece);
      placed = true;
      
      const index = freeRects.indexOf(rect);
      if (index > -1) {
        freeRects.splice(index, 1);
      }
      
      // Generate new free rectangles
      const newRects: FreeRectangle[] = [];
      
      if (rect.width > width + minSpacing) {
        newRects.push({
          x: rect.x + width + minSpacing,
          y: rect.y,
          width: rect.width - width - minSpacing,
          height: rect.height,
        });
      }
      
      if (rect.height > height + minSpacing) {
        newRects.push({
          x: rect.x,
          y: rect.y + height + minSpacing,
          width: rect.width,
          height: rect.height - height - minSpacing,
        });
      }
      
      freeRects.push(...newRects);
      
      // Remove overlapping rectangles
      for (let i = freeRects.length - 1; i >= 0; i--) {
        const r = freeRects[i];
        if (r.x < rect.x + width + minSpacing && 
            r.x + r.width > rect.x &&
            r.y < rect.y + height + minSpacing && 
            r.y + r.height > rect.y) {
          if (r !== rect) {
            freeRects.splice(i, 1);
          }
        }
      }
      
      break;
    }
    
    if (!placed) {
      unplacedPieces.push(piece);
    }
  }
  
  const usedArea = placedPieces.reduce((sum, p) => sum + getPieceArea(p), 0);
  const totalArea = slab.width * slab.height;
  const efficiency = Math.round((usedArea / totalArea) * 100);
  
  return {
    pieces: placedPieces,
    efficiency,
    usedArea,
    wasteArea: totalArea - usedArea,
    unplacedPieces,
    cuttingSequence: placedPieces.map(p => p.cuttingOrder || 0),
    combinationsTested: 0, // Will be set by main function
  };
}

export function optimizeCutting(
  pieces: Piece[], 
  slab: SlabDimensions,
  goal: OptimizationGoal = 'waste-reduction'
): OptimizationResult {
  const strategies = [
    // Strategy 1: Largest area first
    (a: Piece, b: Piece) => {
      const priorityDiff = (b.priority || 1) - (a.priority || 1);
      if (priorityDiff !== 0) return priorityDiff;
      return getPieceArea(b) - getPieceArea(a);
    },
    // Strategy 2: Longest side first
    (a: Piece, b: Piece) => {
      const priorityDiff = (b.priority || 1) - (a.priority || 1);
      if (priorityDiff !== 0) return priorityDiff;
      return Math.max(b.width, b.height) - Math.max(a.width, a.height);
    },
    // Strategy 3: Shortest side first
    (a: Piece, b: Piece) => {
      const priorityDiff = (b.priority || 1) - (a.priority || 1);
      if (priorityDiff !== 0) return priorityDiff;
      return Math.min(a.width, a.height) - Math.min(b.width, b.height);
    },
    // Strategy 4: Width first
    (a: Piece, b: Piece) => {
      const priorityDiff = (b.priority || 1) - (a.priority || 1);
      if (priorityDiff !== 0) return priorityDiff;
      return b.width - a.width;
    },
    // Strategy 5: Height first
    (a: Piece, b: Piece) => {
      const priorityDiff = (b.priority || 1) - (a.priority || 1);
      if (priorityDiff !== 0) return priorityDiff;
      return b.height - a.height;
    },
    // Strategy 6: Perimeter first
    (a: Piece, b: Piece) => {
      const priorityDiff = (b.priority || 1) - (a.priority || 1);
      if (priorityDiff !== 0) return priorityDiff;
      const perimeterA = 2 * (a.width + a.height);
      const perimeterB = 2 * (b.width + b.height);
      return perimeterB - perimeterA;
    },
  ];
  
  let bestResult: OptimizationResult | null = null;
  
  for (const strategy of strategies) {
    const result = tryPackingStrategy(pieces, slab, strategy, goal);
    
    if (!bestResult || 
        result.unplacedPieces.length < bestResult.unplacedPieces.length ||
        (result.unplacedPieces.length === bestResult.unplacedPieces.length && 
         result.efficiency > bestResult.efficiency)) {
      bestResult = result;
    }
  }
  
  if (bestResult) {
    bestResult.combinationsTested = strategies.length * pieces.length * 2; // Approximate
    return bestResult;
  }
  
  return {
    pieces: [],
    efficiency: 0,
    usedArea: 0,
    wasteArea: slab.width * slab.height,
    unplacedPieces: pieces,
    cuttingSequence: [],
    combinationsTested: strategies.length * pieces.length * 2,
  };
}
