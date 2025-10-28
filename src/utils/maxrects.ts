import { Piece, OptimizationResult, SlabDimensions } from '@/types/shapes';

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

class MaxRectsPacker {
  private binWidth: number;
  private binHeight: number;
  private freeRectangles: Rectangle[];
  private usedRectangles: Rectangle[];

  constructor(width: number, height: number) {
    this.binWidth = width;
    this.binHeight = height;
    this.freeRectangles = [{ x: 0, y: 0, width, height }];
    this.usedRectangles = [];
  }

  insert(width: number, height: number, allowRotation: boolean = true, cutout?: { width: number; height: number; position: string }): Rectangle | null {
    let bestRect: Rectangle | null = null;
    let bestShortSideFit = Infinity;
    let bestLongSideFit = Infinity;
    let rotated = false;

    for (const freeRect of this.freeRectangles) {
      // Try normal orientation
      if (freeRect.width >= width && freeRect.height >= height) {
        const leftoverHoriz = Math.abs(freeRect.width - width);
        const leftoverVert = Math.abs(freeRect.height - height);
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        const longSideFit = Math.max(leftoverHoriz, leftoverVert);

        if (shortSideFit < bestShortSideFit || 
            (shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)) {
          bestRect = { x: freeRect.x, y: freeRect.y, width, height };
          bestShortSideFit = shortSideFit;
          bestLongSideFit = longSideFit;
          rotated = false;
        }
      }

      // Try rotated orientation
      if (allowRotation && freeRect.width >= height && freeRect.height >= width) {
        const leftoverHoriz = Math.abs(freeRect.width - height);
        const leftoverVert = Math.abs(freeRect.height - width);
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        const longSideFit = Math.max(leftoverHoriz, leftoverVert);

        if (shortSideFit < bestShortSideFit || 
            (shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)) {
          bestRect = { x: freeRect.x, y: freeRect.y, width: height, height: width };
          bestShortSideFit = shortSideFit;
          bestLongSideFit = longSideFit;
          rotated = true;
        }
      }
    }

    if (bestRect) {
      this.placeRectangle(bestRect);
      
      // If this is an L-shape, add the cutout area back as free space
      if (cutout) {
        this.addCutoutAsFreeSpace(bestRect, cutout, rotated);
      }
      
      return { ...bestRect, width: rotated ? height : width, height: rotated ? width : height };
    }

    return null;
  }

  private addCutoutAsFreeSpace(placedRect: Rectangle, cutout: { width: number; height: number; position: string }, rotated: boolean) {
    let cutoutRect: Rectangle;
    const pos = cutout.position;

    // Adjust cutout position based on rotation
    let adjustedPosition = pos;
    if (rotated) {
      // Rotate the cutout position 90 degrees clockwise
      const positionMap: { [key: string]: string } = {
        'top-right': 'bottom-right',
        'bottom-right': 'bottom-left',
        'bottom-left': 'top-left',
        'top-left': 'top-right'
      };
      adjustedPosition = positionMap[pos] || pos;
    }

    // Calculate cutout rectangle position based on adjusted position
    switch (adjustedPosition) {
      case 'top-right':
        cutoutRect = {
          x: placedRect.x + placedRect.width - cutout.width,
          y: placedRect.y,
          width: cutout.width,
          height: cutout.height
        };
        break;
      case 'top-left':
        cutoutRect = {
          x: placedRect.x,
          y: placedRect.y,
          width: cutout.width,
          height: cutout.height
        };
        break;
      case 'bottom-right':
        cutoutRect = {
          x: placedRect.x + placedRect.width - cutout.width,
          y: placedRect.y + placedRect.height - cutout.height,
          width: cutout.width,
          height: cutout.height
        };
        break;
      case 'bottom-left':
        cutoutRect = {
          x: placedRect.x,
          y: placedRect.y + placedRect.height - cutout.height,
          width: cutout.width,
          height: cutout.height
        };
        break;
      default:
        return;
    }

    // Add the cutout as a new free rectangle
    this.freeRectangles.push(cutoutRect);
    this.pruneFreeList();
  }

  private placeRectangle(rect: Rectangle) {
    const numRectanglesToProcess = this.freeRectangles.length;
    
    for (let i = 0; i < numRectanglesToProcess; i++) {
      if (this.splitFreeNode(this.freeRectangles[i], rect)) {
        this.freeRectangles.splice(i, 1);
        i--;
      }
    }

    this.pruneFreeList();
    this.usedRectangles.push(rect);
  }

  private splitFreeNode(freeNode: Rectangle, usedNode: Rectangle): boolean {
    if (usedNode.x >= freeNode.x + freeNode.width || 
        usedNode.x + usedNode.width <= freeNode.x ||
        usedNode.y >= freeNode.y + freeNode.height || 
        usedNode.y + usedNode.height <= freeNode.y) {
      return false;
    }

    if (usedNode.x < freeNode.x + freeNode.width && usedNode.x + usedNode.width > freeNode.x) {
      if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.height) {
        const newNode = { ...freeNode };
        newNode.height = usedNode.y - newNode.y;
        this.freeRectangles.push(newNode);
      }

      if (usedNode.y + usedNode.height < freeNode.y + freeNode.height) {
        const newNode = { ...freeNode };
        newNode.y = usedNode.y + usedNode.height;
        newNode.height = freeNode.y + freeNode.height - (usedNode.y + usedNode.height);
        this.freeRectangles.push(newNode);
      }
    }

    if (usedNode.y < freeNode.y + freeNode.height && usedNode.y + usedNode.height > freeNode.y) {
      if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.width) {
        const newNode = { ...freeNode };
        newNode.width = usedNode.x - newNode.x;
        this.freeRectangles.push(newNode);
      }

      if (usedNode.x + usedNode.width < freeNode.x + freeNode.width) {
        const newNode = { ...freeNode };
        newNode.x = usedNode.x + usedNode.width;
        newNode.width = freeNode.x + freeNode.width - (usedNode.x + usedNode.width);
        this.freeRectangles.push(newNode);
      }
    }

    return true;
  }

  private pruneFreeList() {
    for (let i = 0; i < this.freeRectangles.length; i++) {
      for (let j = i + 1; j < this.freeRectangles.length; j++) {
        if (this.isContainedIn(this.freeRectangles[i], this.freeRectangles[j])) {
          this.freeRectangles.splice(i, 1);
          i--;
          break;
        }
        if (this.isContainedIn(this.freeRectangles[j], this.freeRectangles[i])) {
          this.freeRectangles.splice(j, 1);
          j--;
        }
      }
    }
  }

  private isContainedIn(a: Rectangle, b: Rectangle): boolean {
    return a.x >= b.x && a.y >= b.y &&
           a.x + a.width <= b.x + b.width &&
           a.y + a.height <= b.y + b.height;
  }
}

// Try different sorting strategies to find best packing
function tryPackingStrategy(pieces: Piece[], slab: SlabDimensions, sortFn: (a: Piece, b: Piece) => number): OptimizationResult {
  const packer = new MaxRectsPacker(slab.width, slab.height);
  const placedPieces: Piece[] = [];
  const unplacedPieces: Piece[] = [];
  
  const colors = [
    'hsl(var(--piece-fill-1))',
    'hsl(var(--piece-fill-2))',
    'hsl(var(--piece-fill-3))',
    'hsl(var(--piece-fill-4))',
    'hsl(var(--piece-fill-5))',
    'hsl(var(--piece-fill-6))',
  ];

  const sortedPieces = [...pieces].sort(sortFn);

  sortedPieces.forEach((piece, index) => {
    const boundingWidth = piece.width;
    const boundingHeight = piece.height;
    
    // Check if this is an L-shape with cutout
    let cutout = undefined;
    if ((piece.type === 'l-left' || piece.type === 'l-right') && piece.cutWidth && piece.cutHeight && piece.cutPosition) {
      cutout = {
        width: piece.cutWidth,
        height: piece.cutHeight,
        position: piece.cutPosition
      };
    }
    
    const result = packer.insert(boundingWidth, boundingHeight, true, cutout);
    
    if (result) {
      const wasRotated = result.width !== boundingWidth;
      placedPieces.push({
        ...piece,
        x: result.x,
        y: result.y,
        rotated: wasRotated,
        width: wasRotated ? piece.height : piece.width,
        height: wasRotated ? piece.width : piece.height,
        color: colors[pieces.indexOf(piece) % colors.length],
      });
    } else {
      unplacedPieces.push(piece);
    }
  });

  const totalArea = slab.width * slab.height;
  let usedArea = 0;

  placedPieces.forEach(piece => {
    // Calculate actual area used by the piece (excluding cutout for L-shapes)
    let pieceArea = piece.width * piece.height;
    
    if ((piece.type === 'l-left' || piece.type === 'l-right') && piece.cutWidth && piece.cutHeight) {
      // Subtract the cutout area for L-shapes
      pieceArea -= piece.cutWidth * piece.cutHeight;
    }
    
    usedArea += pieceArea;
  });

  const wasteArea = totalArea - usedArea;
  const efficiency = (usedArea / totalArea) * 100;

  return {
    pieces: placedPieces,
    efficiency: Math.round(efficiency * 100) / 100,
    wasteArea: Math.round(wasteArea),
    usedArea: Math.round(usedArea),
    unplacedPieces,
  };
}

export function optimizeCutting(pieces: Piece[], slab: SlabDimensions): OptimizationResult {
  // Try multiple sorting strategies
  const strategies = [
    // Strategy 1: Largest area first
    (a: Piece, b: Piece) => (b.width * b.height) - (a.width * a.height),
    // Strategy 2: Longest side first
    (a: Piece, b: Piece) => Math.max(b.width, b.height) - Math.max(a.width, a.height),
    // Strategy 3: Shortest side first
    (a: Piece, b: Piece) => Math.min(b.width, b.height) - Math.min(a.width, a.height),
    // Strategy 4: Width first
    (a: Piece, b: Piece) => b.width - a.width,
    // Strategy 5: Height first
    (a: Piece, b: Piece) => b.height - a.height,
    // Strategy 6: Perimeter first
    (a: Piece, b: Piece) => (b.width + b.height) - (a.width + a.height),
  ];

  let bestResult: OptimizationResult | null = null;

  // Try each strategy and keep the best result
  for (const strategy of strategies) {
    const result = tryPackingStrategy(pieces, slab, strategy);
    
    if (!bestResult || 
        result.unplacedPieces.length < bestResult.unplacedPieces.length ||
        (result.unplacedPieces.length === bestResult.unplacedPieces.length && result.efficiency > bestResult.efficiency)) {
      bestResult = result;
    }
    
    // If we found a perfect fit, stop trying
    if (result.unplacedPieces.length === 0) {
      break;
    }
  }

  return bestResult!;
}
