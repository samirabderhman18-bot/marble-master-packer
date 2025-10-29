import { Piece } from '@/types/shapes';

export function doPiecesOverlap(piece1: Piece, piece2: Piece): boolean {
  if (
    piece1.x === undefined ||
    piece1.y === undefined ||
    piece2.x === undefined ||
    piece2.y === undefined
  ) {
    return false;
  }

  return (
    piece1.x < piece2.x + piece2.width &&
    piece1.x + piece1.width > piece2.x &&
    piece1.y < piece2.y + piece2.height &&
    piece1.y + piece1.height > piece2.y
  );
}
