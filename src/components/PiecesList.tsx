import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { Piece } from '@/types/shapes';

interface PiecesListProps {
  pieces: Piece[];
  onRemove: (id: string) => void;
  unit: 'cm' | 'mm';
}

const getShapeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'rectangle': 'Rectangle',
    'l-left': 'L-Gauche',
    'l-right': 'L-Droite',
    't-shape': 'Forme T',
    'circle': 'Cercle',
    'triangle': 'Triangle',
    'custom': 'Personnalisé',
  };
  return labels[type] || type;
};

const getPieceDimensions = (piece: Piece, unit: string) => {
  switch (piece.type) {
    case 'circle':
      return `R: ${piece.radius}${unit}`;
    case 'triangle':
      return `Base: ${piece.base}${unit}, H: ${piece.triangleHeight}${unit}`;
    case 'l-left':
    case 'l-right':
      return `${piece.width}×${piece.height}${unit} (Découpe: ${piece.cutWidth}×${piece.cutHeight}${unit})`;
    default:
      return `${piece.width}×${piece.height}${unit}`;
  }
};

export const PiecesList = ({ pieces, onRemove, unit }: PiecesListProps) => {
  return (
    <Card className="p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Pièces à Découper</h3>
      <ScrollArea className="h-[400px] pr-4">
        {pieces.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune pièce ajoutée
          </p>
        ) : (
          <div className="space-y-2">
            {pieces.map((piece) => (
              <div
                key={piece.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/80 transition-colors"
                style={{ backgroundColor: piece.color || 'hsl(var(--accent))' }}
              >
                <div>
                  <p className="font-medium text-sm">{getShapeLabel(piece.type)}</p>
                  <p className="text-xs text-muted-foreground">{getPieceDimensions(piece, unit)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(piece.id)}
                  className="hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};
