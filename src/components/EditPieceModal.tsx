import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Piece } from '@/types/shapes';

interface EditPieceModalProps {
  piece: Piece | null;
  open: boolean;
  onClose: () => void;
  onSave: (piece: Piece) => void;
}

export const EditPieceModal = ({ piece, open, onClose, onSave }: EditPieceModalProps) => {
  const [editedPiece, setEditedPiece] = useState<Piece | null>(null);

  useEffect(() => {
    if (piece) {
      setEditedPiece({ ...piece });
    }
  }, [piece]);

  if (!editedPiece) return null;

  const handleSave = () => {
    onSave(editedPiece);
    onClose();
  };

  const updateField = (field: keyof Piece, value: number) => {
    setEditedPiece({ ...editedPiece, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la Pièce</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width">Largeur (mm)</Label>
              <Input
                id="width"
                type="number"
                value={editedPiece.width}
                onChange={(e) => updateField('width', parseFloat(e.target.value))}
                min={1}
              />
            </div>
            
            <div>
              <Label htmlFor="height">Hauteur (mm)</Label>
              <Input
                id="height"
                type="number"
                value={editedPiece.height}
                onChange={(e) => updateField('height', parseFloat(e.target.value))}
                min={1}
              />
            </div>
          </div>

          {(editedPiece.type === 'l-left' || editedPiece.type === 'l-right') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cutWidth">Largeur Découpe (mm)</Label>
                <Input
                  id="cutWidth"
                  type="number"
                  value={editedPiece.cutWidth || 0}
                  onChange={(e) => updateField('cutWidth', parseFloat(e.target.value))}
                  min={1}
                />
              </div>
              
              <div>
                <Label htmlFor="cutHeight">Hauteur Découpe (mm)</Label>
                <Input
                  id="cutHeight"
                  type="number"
                  value={editedPiece.cutHeight || 0}
                  onChange={(e) => updateField('cutHeight', parseFloat(e.target.value))}
                  min={1}
                />
              </div>
            </div>
          )}

          {editedPiece.type === 't-shape' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="topWidth">Largeur Haut (mm)</Label>
                <Input
                  id="topWidth"
                  type="number"
                  value={editedPiece.topWidth || 0}
                  onChange={(e) => updateField('topWidth', parseFloat(e.target.value))}
                  min={1}
                />
              </div>
              
              <div>
                <Label htmlFor="stemWidth">Largeur Tige (mm)</Label>
                <Input
                  id="stemWidth"
                  type="number"
                  value={editedPiece.stemWidth || 0}
                  onChange={(e) => updateField('stemWidth', parseFloat(e.target.value))}
                  min={1}
                />
              </div>
            </div>
          )}

          {editedPiece.type === 'circle' && (
            <div>
              <Label htmlFor="radius">Rayon (mm)</Label>
              <Input
                id="radius"
                type="number"
                value={editedPiece.radius || 0}
                onChange={(e) => updateField('radius', parseFloat(e.target.value))}
                min={1}
              />
            </div>
          )}

          {editedPiece.type === 'triangle' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base">Base (mm)</Label>
                <Input
                  id="base"
                  type="number"
                  value={editedPiece.base || 0}
                  onChange={(e) => updateField('base', parseFloat(e.target.value))}
                  min={1}
                />
              </div>
              
              <div>
                <Label htmlFor="triangleHeight">Hauteur (mm)</Label>
                <Input
                  id="triangleHeight"
                  type="number"
                  value={editedPiece.triangleHeight || 0}
                  onChange={(e) => updateField('triangleHeight', parseFloat(e.target.value))}
                  min={1}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
