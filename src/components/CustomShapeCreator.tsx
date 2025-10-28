import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShapeType, Piece } from '@/types/shapes';
import { Plus } from 'lucide-react';

interface CustomShapeCreatorProps {
  onAdd: (piece: Piece) => void;
}

export const CustomShapeCreator = ({ onAdd }: CustomShapeCreatorProps) => {
  const [shapeType, setShapeType] = useState<ShapeType>('rectangle');
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(200);
  const [cutWidth, setCutWidth] = useState(100);
  const [cutHeight, setCutHeight] = useState(100);
  const [radius, setRadius] = useState(150);
  const [base, setBase] = useState(200);
  const [triangleHeight, setTriangleHeight] = useState(200);

  const handleAdd = () => {
    const basePiece = {
      id: crypto.randomUUID(),
      type: shapeType,
      width,
      height,
    };

    let piece: Piece = basePiece;

    switch (shapeType) {
      case 'l-left':
      case 'l-right':
        piece = { ...basePiece, cutWidth, cutHeight };
        break;
      case 'circle':
        piece = { ...basePiece, radius, width: radius * 2, height: radius * 2 };
        break;
      case 'triangle':
        piece = { ...basePiece, base, triangleHeight, width: base, height: triangleHeight };
        break;
    }

    onAdd(piece);
  };

  return (
    <Card className="p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Créer une Pièce</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="shapeType">Type de Forme</Label>
          <Select value={shapeType} onValueChange={(value) => setShapeType(value as ShapeType)}>
            <SelectTrigger id="shapeType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rectangle">Rectangle</SelectItem>
              <SelectItem value="l-left">L-Gauche</SelectItem>
              <SelectItem value="l-right">L-Droite</SelectItem>
              <SelectItem value="t-shape">Forme T</SelectItem>
              <SelectItem value="circle">Cercle</SelectItem>
              <SelectItem value="triangle">Triangle</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {shapeType === 'circle' ? (
          <div>
            <Label htmlFor="radius">Rayon (mm)</Label>
            <Input
              id="radius"
              type="number"
              value={radius}
              onChange={(e) => setRadius(parseFloat(e.target.value))}
              min={1}
            />
          </div>
        ) : shapeType === 'triangle' ? (
          <>
            <div>
              <Label htmlFor="base">Base (mm)</Label>
              <Input
                id="base"
                type="number"
                value={base}
                onChange={(e) => setBase(parseFloat(e.target.value))}
                min={1}
              />
            </div>
            <div>
              <Label htmlFor="triangleHeight">Hauteur (mm)</Label>
              <Input
                id="triangleHeight"
                type="number"
                value={triangleHeight}
                onChange={(e) => setTriangleHeight(parseFloat(e.target.value))}
                min={1}
              />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Largeur (mm)</Label>
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value))}
                  min={1}
                />
              </div>
              <div>
                <Label htmlFor="height">Hauteur (mm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value))}
                  min={1}
                />
              </div>
            </div>

            {(shapeType === 'l-left' || shapeType === 'l-right') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cutWidth">Largeur Découpe (mm)</Label>
                  <Input
                    id="cutWidth"
                    type="number"
                    value={cutWidth}
                    onChange={(e) => setCutWidth(parseFloat(e.target.value))}
                    min={1}
                  />
                </div>
                <div>
                  <Label htmlFor="cutHeight">Hauteur Découpe (mm)</Label>
                  <Input
                    id="cutHeight"
                    type="number"
                    value={cutHeight}
                    onChange={(e) => setCutHeight(parseFloat(e.target.value))}
                    min={1}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <Button onClick={handleAdd} className="w-full" size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter la Pièce
        </Button>
      </div>
    </Card>
  );
};
