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

  insert(width: number, height: number, allowRotation: boolean = true): Rectangle | null {
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
      return { ...bestRect, width: rotated ? height : width, height: rotated ? width : height };
    }

    return null;
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

export function optimizeCutting(pieces: Piece[], slab: SlabDimensions): OptimizationResult {
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

  pieces.forEach((piece, index) => {
    const boundingWidth = piece.width;
    const boundingHeight = piece.height;
    
    const result = packer.insert(boundingWidth, boundingHeight, true);
    
    if (result) {
      const wasRotated = result.width !== boundingWidth;
      placedPieces.push({
        ...piece,
        x: result.x,
        y: result.y,
        rotated: wasRotated,
        width: wasRotated ? piece.height : piece.width,
        height: wasRotated ? piece.width : piece.height,
        color: colors[index % colors.length],
      });
    } else {
      unplacedPieces.push(piece);
    }
  });

  const totalArea = slab.width * slab.height;
  let usedArea = 0;

  placedPieces.forEach(piece => {
    usedArea += piece.width * piece.height;
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
