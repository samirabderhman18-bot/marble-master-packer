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

interface GeneticIndividual {
  permutation: number[];
  rotations: boolean[];
  fitness: number;
  result: OptimizationResult;
}

const PIECE_COLORS = [
  'hsl(210, 85%, 70%)', 'hsl(145, 75%, 65%)', 'hsl(340, 80%, 70%)',
  'hsl(45, 95%, 65%)', 'hsl(270, 75%, 70%)', 'hsl(25, 90%, 65%)',
  'hsl(195, 80%, 65%)', 'hsl(15, 85%, 68%)',
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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

// ============================================================================
// ADVANCED SCORING WITH MULTI-OBJECTIVE OPTIMIZATION
// ============================================================================

function calculateAdvancedScore(
  piece: Piece, 
  rect: FreeRectangle, 
  rotated: boolean, 
  goal: OptimizationGoal,
  slab: SlabDimensions,
  placedPieces: Piece[]
): number {
  const area = getPieceArea(piece);
  const wastedSpace = (rect.width * rect.height) - area;
  const priority = piece.priority || 1;
  const grainBonus = isGrainAligned(piece, rotated, slab) ? 100 : 0;
  
  // Contact perimeter heuristic (pieces touching edges waste less)
  const touchingLeft = rect.x === (slab.margin || 1);
  const touchingBottom = rect.y === (slab.margin || 1);
  const contactBonus = (touchingLeft ? 20 : 0) + (touchingBottom ? 20 : 0);
  
  // Guillotine cut bonus (aligned with existing pieces)
  let guillotineBonus = 0;
  for (const placed of placedPieces) {
    if (Math.abs((placed.x! + placed.width) - rect.x) < 0.1 ||
        Math.abs((placed.y! + placed.height) - rect.y) < 0.1) {
      guillotineBonus += 15;
    }
  }
  
  // Rectangle quality (prefer square-ish remainders)
  const aspectRatio = Math.max(rect.width, rect.height) / Math.min(rect.width, rect.height);
  const aspectPenalty = aspectRatio > 3 ? -10 : 0;
  
  switch (goal) {
    case 'waste-reduction':
      return -wastedSpace + (priority * 1000) + grainBonus + contactBonus + guillotineBonus + aspectPenalty;
    case 'production-speed':
      return -(rect.x + rect.y) + (priority * 1000) + grainBonus + guillotineBonus;
    case 'aesthetic-matching':
      return grainBonus * 10 + (priority * 1000) - wastedSpace + contactBonus;
    case 'cost-efficiency':
      return (area * priority) - wastedSpace + grainBonus + contactBonus + guillotineBonus;
    default:
      return -wastedSpace + (priority * 1000) + contactBonus + guillotineBonus;
  }
}

// ============================================================================
// IMPROVED MAXRECTS WITH BETTER RECTANGLE MANAGEMENT
// ============================================================================

function splitRectangleAdvanced(
  rect: FreeRectangle, 
  piece: Piece, 
  x: number, 
  y: number, 
  spacing: number
): FreeRectangle[] {
  const newRects: FreeRectangle[] = [];
  
  // Maximal rectangles approach: create all possible maximal free rectangles
  
  // Right remainder
  if (rect.x + rect.width > x + piece.width + spacing) {
    newRects.push({
      x: x + piece.width + spacing,
      y: rect.y,
      width: rect.x + rect.width - (x + piece.width + spacing),
      height: rect.height,
    });
  }
  
  // Top remainder (extending full width)
  if (rect.y + rect.height > y + piece.height + spacing) {
    newRects.push({
      x: rect.x,
      y: y + piece.height + spacing,
      width: rect.width,
      height: rect.y + rect.height - (y + piece.height + spacing),
    });
  }
  
  // Additional maximal rectangles for better space utilization
  if (rect.x + rect.width > x + piece.width + spacing && 
      rect.y + rect.height > y + piece.height + spacing) {
    // Top-right corner rectangle
    newRects.push({
      x: x + piece.width + spacing,
      y: y + piece.height + spacing,
      width: rect.x + rect.width - (x + piece.width + spacing),
      height: rect.y + rect.height - (y + piece.height + spacing),
    });
  }
  
  return newRects.filter(r => r.width > 0.1 && r.height > 0.1);
}

function pruneRectangles(freeRects: FreeRectangle[]): void {
  // Remove rectangles that are fully contained within others
  for (let i = freeRects.length - 1; i >= 0; i--) {
    const r = freeRects[i];
    for (let j = 0; j < freeRects.length; j++) {
      if (i !== j) {
        const other = freeRects[j];
        if (r.x >= other.x && r.y >= other.y &&
            r.x + r.width <= other.x + other.width &&
            r.y + r.height <= other.y + other.height) {
          freeRects.splice(i, 1);
          break;
        }
      }
    }
  }
}

// ============================================================================
// BEAM SEARCH FOR BETTER LOCAL OPTIMIZATION
// ============================================================================

function beamSearchPacking(
  pieces: Piece[],
  slab: SlabDimensions,
  goal: OptimizationGoal,
  beamWidth: number = 3
): OptimizationResult {
  const margin = slab.margin || 1;
  const minSpacing = slab.minSpacing || 0.5;
  
  const freeRects: FreeRectangle[] = [{
    x: margin, y: margin,
    width: slab.width - 2 * margin,
    height: slab.height - 2 * margin,
  }];
  
  const placedPieces: Piece[] = [];
  const unplacedPieces: Piece[] = [];
  let cuttingOrder = 1;
  
  for (const piece of pieces) {
    const candidates: PlacementAttempt[] = [];
    
    // Evaluate all possible placements for this piece
    for (const rect of freeRects) {
      // Try normal orientation
      if (piece.width <= rect.width && piece.height <= rect.height) {
        if (!doesIntersectDefect(piece, rect.x, rect.y, slab)) {
          candidates.push({
            piece, rect, rotated: false,
            score: calculateAdvancedScore(piece, rect, false, goal, slab, placedPieces)
          });
        }
      }
      
      // Try rotated orientation
      if (piece.width !== piece.height && piece.height <= rect.width && piece.width <= rect.height) {
        if (!doesIntersectDefect(piece, rect.x, rect.y, slab)) {
          candidates.push({
            piece, rect, rotated: true,
            score: calculateAdvancedScore(piece, rect, true, goal, slab, placedPieces)
          });
        }
      }
    }
    
    // Keep top beamWidth candidates
    candidates.sort((a, b) => b.score - a.score);
    const bestPlacement = candidates[0];
    
    if (bestPlacement) {
      const { rect, rotated } = bestPlacement;
      const width = rotated ? piece.height : piece.width;
      const height = rotated ? piece.width : piece.height;
      
      const newPiece: Piece = {
        ...piece, x: rect.x, y: rect.y, width, height, rotated,
        cuttingOrder: cuttingOrder++,
        color: PIECE_COLORS[placedPieces.length % PIECE_COLORS.length],
      };
      
      if (rotated && (piece.type === 'l-left' || piece.type === 'l-right')) {
        newPiece.cutWidth = piece.cutHeight;
        newPiece.cutHeight = piece.cutWidth;
      }
      
      placedPieces.push(newPiece);
      
      // Remove used rectangle
      const index = freeRects.indexOf(rect);
      if (index > -1) freeRects.splice(index, 1);
      
      // Generate new rectangles with advanced splitting
      const newRects = splitRectangleAdvanced(rect, newPiece, rect.x, rect.y, minSpacing);
      freeRects.push(...newRects);
      
      // Prune dominated rectangles
      pruneRectangles(freeRects);
    } else {
      unplacedPieces.push(piece);
    }
  }
  
  const usedArea = placedPieces.reduce((sum, p) => sum + getPieceArea(p), 0);
  const totalArea = slab.width * slab.height;
  const efficiency = Math.round((usedArea / totalArea) * 100);
  
  return {
    pieces: placedPieces, efficiency, usedArea,
    wasteArea: totalArea - usedArea, unplacedPieces,
    cuttingSequence: placedPieces.map(p => p.cuttingOrder || 0),
    combinationsTested: 0,
  };
}

// ============================================================================
// GENETIC ALGORITHM FOR GLOBAL OPTIMIZATION
// ============================================================================

function createRandomIndividual(pieceCount: number): GeneticIndividual {
  const permutation = Array.from({ length: pieceCount }, (_, i) => i);
  for (let i = permutation.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
  }
  const rotations = Array.from({ length: pieceCount }, () => Math.random() < 0.5);
  
  return { permutation, rotations, fitness: 0, result: {} as OptimizationResult };
}

function evaluateIndividual(
  individual: GeneticIndividual,
  pieces: Piece[],
  slab: SlabDimensions,
  goal: OptimizationGoal
): void {
  const orderedPieces = individual.permutation.map((idx, i) => ({
    ...pieces[idx],
    forceRotation: individual.rotations[i]
  }));
  
  const result = beamSearchPacking(orderedPieces, slab, goal, 2);
  individual.result = result;
  
  // Multi-objective fitness
  const placedCount = result.pieces.length;
  const efficiency = result.efficiency;
  const unplacedPenalty = result.unplacedPieces.length * 1000;
  
  individual.fitness = efficiency + (placedCount * 100) - unplacedPenalty;
}

function crossover(parent1: GeneticIndividual, parent2: GeneticIndividual): GeneticIndividual {
  const length = parent1.permutation.length;
  const child: GeneticIndividual = {
    permutation: new Array(length),
    rotations: new Array(length),
    fitness: 0,
    result: {} as OptimizationResult
  };
  
  // Order crossover (OX) for permutation
  const start = Math.floor(Math.random() * length);
  const end = start + Math.floor(Math.random() * (length - start));
  
  const segment = parent1.permutation.slice(start, end);
  child.permutation.fill(-1);
  for (let i = start; i < end; i++) {
    child.permutation[i] = segment[i - start];
  }
  
  let pos = 0;
  for (let i = 0; i < length; i++) {
    const gene = parent2.permutation[i];
    if (!segment.includes(gene)) {
      while (child.permutation[pos] !== -1) pos++;
      child.permutation[pos] = gene;
    }
  }
  
  // Uniform crossover for rotations
  for (let i = 0; i < length; i++) {
    child.rotations[i] = Math.random() < 0.5 ? parent1.rotations[i] : parent2.rotations[i];
  }
  
  return child;
}

function mutate(individual: GeneticIndividual, mutationRate: number = 0.1): void {
  // Swap mutation for permutation
  if (Math.random() < mutationRate) {
    const i = Math.floor(Math.random() * individual.permutation.length);
    const j = Math.floor(Math.random() * individual.permutation.length);
    [individual.permutation[i], individual.permutation[j]] = 
      [individual.permutation[j], individual.permutation[i]];
  }
  
  // Flip mutation for rotations
  for (let i = 0; i < individual.rotations.length; i++) {
    if (Math.random() < mutationRate) {
      individual.rotations[i] = !individual.rotations[i];
    }
  }
}

function geneticAlgorithm(
  pieces: Piece[],
  slab: SlabDimensions,
  goal: OptimizationGoal,
  params: { populationSize: number; generations: number; mutationRate: number }
): OptimizationResult {
  const { populationSize, generations, mutationRate } = params;
  
  // Initialize population
  let population: GeneticIndividual[] = [];
  for (let i = 0; i < populationSize; i++) {
    const individual = createRandomIndividual(pieces.length);
    evaluateIndividual(individual, pieces, slab, goal);
    population.push(individual);
  }
  
  let bestEver = population.reduce((best, ind) => 
    ind.fitness > best.fitness ? ind : best
  );
  
  // Evolution loop
  for (let gen = 0; gen < generations; gen++) {
    // Selection: Tournament selection
    const newPopulation: GeneticIndividual[] = [];
    
    // Elitism: keep best 2
    population.sort((a, b) => b.fitness - a.fitness);
    newPopulation.push(population[0], population[1]);
    
    while (newPopulation.length < populationSize) {
      // Tournament selection
      const tournament1 = [0, 1, 2].map(() => 
        population[Math.floor(Math.random() * population.length)]
      );
      const tournament2 = [0, 1, 2].map(() => 
        population[Math.floor(Math.random() * population.length)]
      );
      
      const parent1 = tournament1.reduce((best, ind) => 
        ind.fitness > best.fitness ? ind : best
      );
      const parent2 = tournament2.reduce((best, ind) => 
        ind.fitness > best.fitness ? ind : best
      );
      
      const child = crossover(parent1, parent2);
      mutate(child, mutationRate);
      evaluateIndividual(child, pieces, slab, goal);
      newPopulation.push(child);
    }
    
    population = newPopulation;
    const bestInGen = population.reduce((best, ind) => 
      ind.fitness > best.fitness ? ind : best
    );
    
    if (bestInGen.fitness > bestEver.fitness) {
      bestEver = bestInGen;
    }
  }
  
  bestEver.result.combinationsTested = populationSize * generations;
  return bestEver.result;
}

// ============================================================================
// MAIN OPTIMIZATION FUNCTION
// ============================================================================

export function optimizeCutting(
  pieces: Piece[], 
  slab: SlabDimensions,
  goal: OptimizationGoal = 'waste-reduction'
): OptimizationResult {
  const pieceCount = pieces.length;
  
  // For small problems, use genetic algorithm
  if (pieceCount <= 30) {
    return geneticAlgorithm(pieces, slab, goal, {
      populationSize: Math.min(50, pieceCount * 2),
      generations: Math.min(100, pieceCount * 3),
      mutationRate: 0.15
    });
  }
  
  // For larger problems, use multiple advanced heuristics with beam search
  const strategies = [
    // Largest area first
    (a: Piece, b: Piece) => {
      const priorityDiff = (b.priority || 1) - (a.priority || 1);
      if (priorityDiff !== 0) return priorityDiff;
      return getPieceArea(b) - getPieceArea(a);
    },
    // Best fit decreasing (area/perimeter ratio)
    (a: Piece, b: Piece) => {
      const priorityDiff = (b.priority || 1) - (a.priority || 1);
      if (priorityDiff !== 0) return priorityDiff;
      const ratioA = getPieceArea(a) / (2 * (a.width + a.height));
      const ratioB = getPieceArea(b) / (2 * (b.width + b.height));
      return ratioB - ratioA;
    },
    // Longest side first
    (a: Piece, b: Piece) => {
      const priorityDiff = (b.priority || 1) - (a.priority || 1);
      if (priorityDiff !== 0) return priorityDiff;
      return Math.max(b.width, b.height) - Math.max(a.width, a.height);
    },
    // Aspect ratio (prefer squares)
    (a: Piece, b: Piece) => {
      const priorityDiff = (b.priority || 1) - (a.priority || 1);
      if (priorityDiff !== 0) return priorityDiff;
      const aspectA = Math.max(a.width, a.height) / Math.min(a.width, a.height);
      const aspectB = Math.max(b.width, b.height) / Math.min(b.width, b.height);
      return aspectA - aspectB;
    },
  ];
  
  let bestResult: OptimizationResult | null = null;
  
  for (const strategy of strategies) {
    const sortedPieces = [...pieces].sort(strategy);
    const result = beamSearchPacking(sortedPieces, slab, goal, 5);
    
    if (!bestResult || 
        result.unplacedPieces.length < bestResult.unplacedPieces.length ||
        (result.unplacedPieces.length === bestResult.unplacedPieces.length && 
         result.efficiency > bestResult.efficiency)) {
      bestResult = result;
    }
  }
  
  if (bestResult) {
    bestResult.combinationsTested = strategies.length * pieces.length * 10;
    return bestResult;
  }
  
  return {
    pieces: [], efficiency: 0, usedArea: 0,
    wasteArea: slab.width * slab.height, unplacedPieces: pieces,
    cuttingSequence: [], combinationsTested: 0,
  };
}
