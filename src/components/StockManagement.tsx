import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Stock } from '@/types/orders';
import { Plus, Edit, Trash2, AlertTriangle, Package } from 'lucide-react';
import { toast } from 'sonner';

interface StockManagementProps {
  stock: Stock[];
  onAddStock: (item: Stock) => void;
  onUpdateStock: (item: Stock) => void;
  onDeleteStock: (id: string) => void;
}

export const StockManagement = ({ stock, onAddStock, onUpdateStock, onDeleteStock }: StockManagementProps) => {
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isEditStockOpen, setIsEditStockOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  
  const [materialType, setMaterialType] = useState('');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [thickness, setThickness] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');
  const [supplier, setSupplier] = useState('');
  const [costPerUnit, setCostPerUnit] = useState(0);
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setMaterialType('');
    setWidth(0);
    setHeight(0);
    setThickness(0);
    setQuantity(1);
    setLocation('');
    setSupplier('');
    setCostPerUnit(0);
    setNotes('');
  };

  const loadStockData = (item: Stock) => {
    setMaterialType(item.materialType);
    setWidth(item.width);
    setHeight(item.height);
    setThickness(item.thickness);
    setQuantity(item.quantity);
    setLocation(item.location || '');
    setSupplier(item.supplier || '');
    setCostPerUnit(item.costPerUnit);
    setNotes(item.notes || '');
  };

  const handleAddStock = () => {
    if (!materialType || width <= 0 || height <= 0 || thickness <= 0 || quantity <= 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const newStock: Stock = {
      id: crypto.randomUUID(),
      materialType,
      width,
      height,
      thickness,
      quantity,
      location,
      supplier,
      purchaseDate: new Date(),
      costPerUnit,
      notes,
    };

    onAddStock(newStock);
    resetForm();
    setIsAddStockOpen(false);
    toast.success('Stock ajouté avec succès!');
  };

  const handleUpdateStock = () => {
    if (!selectedStock) return;

    const updatedStock: Stock = {
      ...selectedStock,
      materialType,
      width,
      height,
      thickness,
      quantity,
      location,
      supplier,
      costPerUnit,
      notes,
    };

    onUpdateStock(updatedStock);
    resetForm();
    setIsEditStockOpen(false);
    setSelectedStock(null);
    toast.success('Stock mis à jour!');
  };

  const getTotalValue = () => {
    return stock.reduce((sum, item) => sum + (item.costPerUnit * item.quantity), 0);
  };

  const getLowStockItems = () => {
    return stock.filter(item => item.quantity <= 2);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Gestion du Stock</h3>
            <p className="text-sm text-muted-foreground">
              {stock.length} article(s) • Valeur totale: {getTotalValue().toFixed(2)} DZD
            </p>
          </div>
          <Button onClick={() => setIsAddStockOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Stock
          </Button>
        </div>

        {getLowStockItems().length > 0 && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">
                {getLowStockItems().length} article(s) en stock faible
              </span>
            </div>
          </div>
        )}

        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {stock.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucun stock disponible</p>
              </div>
            ) : (
              stock.map(item => (
                <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{item.materialType}</h4>
                        {item.quantity <= 2 && (
                          <Badge className="bg-orange-500">Stock Faible</Badge>
                        )}
                        {item.quantity > 10 && (
                          <Badge className="bg-green-500">Stock OK</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Dimensions: {item.width} × {item.height} × {item.thickness} cm
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        Quantité: <span className="font-semibold">{item.quantity}</span> dalle(s)
                      </p>
                      {item.location && (
                        <p className="text-sm text-muted-foreground">
                          Emplacement: {item.location}
                        </p>
                      )}
                      {item.supplier && (
                        <p className="text-sm text-muted-foreground">
                          Fournisseur: {item.supplier}
                        </p>
                      )}
                      <p className="text-sm font-semibold mt-2">
                        Coût unitaire: {item.costPerUnit.toFixed(2)} DZD
                      </p>
                      <p className="text-sm text-primary font-semibold">
                        Valeur totale: {(item.costPerUnit * item.quantity).toFixed(2)} DZD
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedStock(item);
                          loadStockData(item);
                          setIsEditStockOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Supprimer cet article du stock?')) {
                            onDeleteStock(item.id);
                            toast.success('Article supprimé');
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Add Stock Dialog */}
      <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter du Stock</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de Matériau *</Label>
                <Input
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  placeholder="Marbre blanc, Granit noir..."
                />
              </div>
              <div>
                <Label>Quantité *</Label>
                <Input
                  type="number"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  min={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Largeur (cm) *</Label>
                <Input
                  type="number"
                  value={width || ''}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.1}
                />
              </div>
              <div>
                <Label>Hauteur (cm) *</Label>
                <Input
                  type="number"
                  value={height || ''}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.1}
                />
              </div>
              <div>
                <Label>Épaisseur (cm) *</Label>
                <Input
                  type="number"
                  value={thickness || ''}
                  onChange={(e) => setThickness(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.1}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Emplacement</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Entrepôt A, Rayon 3..."
                />
              </div>
              <div>
                <Label>Fournisseur</Label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Nom du fournisseur"
                />
              </div>
            </div>

            <div>
              <Label>Coût Unitaire (DZD) *</Label>
              <Input
                type="number"
                value={costPerUnit || ''}
                onChange={(e) => setCostPerUnit(parseFloat(e.target.value) || 0)}
                min={0}
                step={0.01}
              />
            </div>

            <div>
              <Label>Notes</Label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes additionnelles..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsAddStockOpen(false);
                resetForm();
              }}>
                Annuler
              </Button>
              <Button onClick={handleAddStock}>
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Stock Dialog */}
      <Dialog open={isEditStockOpen} onOpenChange={setIsEditStockOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le Stock</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de Matériau *</Label>
                <Input
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                />
              </div>
              <div>
                <Label>Quantité *</Label>
                <Input
                  type="number"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  min={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Largeur (cm) *</Label>
                <Input
                  type="number"
                  value={width || ''}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                  step={0.1}
                />
              </div>
              <div>
                <Label>Hauteur (cm) *</Label>
                <Input
                  type="number"
                  value={height || ''}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                  step={0.1}
                />
              </div>
              <div>
                <Label>Épaisseur (cm) *</Label>
                <Input
                  type="number"
                  value={thickness || ''}
                  onChange={(e) => setThickness(parseFloat(e.target.value) || 0)}
                  step={0.1}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Emplacement</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <Label>Fournisseur</Label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Coût Unitaire (DZD) *</Label>
              <Input
                type="number"
                value={costPerUnit || ''}
                onChange={(e) => setCostPerUnit(parseFloat(e.target.value) || 0)}
                step={0.01}
              />
            </div>

            <div>
              <Label>Notes</Label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsEditStockOpen(false);
                setSelectedStock(null);
                resetForm();
              }}>
                Annuler
              </Button>
              <Button onClick={handleUpdateStock}>
                Mettre à jour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
