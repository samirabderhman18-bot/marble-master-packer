import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Square, Move, Diamond, Circle, Triangle, Shapes } from 'lucide-react';
import { ShapeType } from '@/types/shapes';

interface ShapeLibraryProps {
  onAddShape: (type: ShapeType) => void;
}

const shapes = [
  { type: 'rectangle' as ShapeType, icon: Square, label: 'Rectangle', color: 'text-blue-500' },
  { type: 'l-left' as ShapeType, icon: Move, label: 'L-Gauche', color: 'text-green-500' },
  { type: 'l-right' as ShapeType, icon: Move, label: 'L-Droite', color: 'text-emerald-500' },
  { type: 't-shape' as ShapeType, icon: Diamond, label: 'Forme T', color: 'text-yellow-500' },
  { type: 'circle' as ShapeType, icon: Circle, label: 'Cercle', color: 'text-purple-500' },
  { type: 'triangle' as ShapeType, icon: Triangle, label: 'Triangle', color: 'text-orange-500' },
  { type: 'custom' as ShapeType, icon: Shapes, label: 'Personnalisé', color: 'text-pink-500' },
];

export const ShapeLibrary = ({ onAddShape }: ShapeLibraryProps) => {
  return (
    <Card className="p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Bibliothèque de Formes</h3>
      <div className="grid grid-cols-2 gap-3">
        {shapes.map(shape => {
          const Icon = shape.icon;
          return (
            <Button
              key={shape.type}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-accent transition-all"
              onClick={() => onAddShape(shape.type)}
            >
              <Icon className={`w-8 h-8 ${shape.color}`} />
              <span className="text-xs font-medium">{shape.label}</span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
};
