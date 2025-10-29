import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { OffCut } from '@/types/orders';
import { Plus, Trash2, Search, Recycle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface OffCutManagementProps {
  offCuts: OffCut[];
  onAddOffCut: (offCut: OffCut) => void;
  onDeleteOffCut: (id: string) => void;
  onUseOffCut: (offCut: OffCut) => void;
}

export const OffCutManagement = ({ offCuts, onAddOffCut, onDeleteOffCut, onUseOffCut }: OffCutManagementProps) => {
  const [isAddOffCutOpen, setIsAddOffCutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterQuality, setFilterQuality] = useState<string>('all');
  const [minWidth, setMinWidth] = useState(0);
  const [minHeight, setMinHeight] = useState(0);
  
  const [materialType, setMaterialType] = useState('');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [thickness, setThickness] = useState(0);
  const [location, setLocation] = useState('');
  const [sourceOrder, setSourceOrder] = useState('');
  const [quality, setQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [notes, setNotes] = useState('');

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Bon';
      case 'fair': return 'Moyen';
      case 'poor': return 'Faible';
      default: return quality;
    }
  };

  const resetForm = () => {
    setMaterialType('');
    setWidth(0);
    setHeight(0);
    setThickness(0);
    setLocation('');
    setSourceOrder('');
    setQuality('good');
    setNotes('');
  };

  const handleAddOffCut = () => {
    if (!materialType || width <= 0 || height <= 0 || thickness <= 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const area = width * height;
    const isUsable = width >= 10 && height >= 10 && quality !== 'poor';

    const newOffCut: OffCut = {
      id: crypto.randomUUID(),
      materialType,
      width,
      height,
      thickness,
      area,
      location,
      sourceOrder,
      createdAt: new Date(),
      isUsable,
      quality,
      notes,
    };

    onAddOffCut(newOffCut);
    resetForm();
    setIsAddOffCutOpen(false);
    toast.success('Chute ajoutée avec succès!');
  };

  const filteredOffCuts = offCuts.filter(offCut => {
    const matchesSearch = offCut.materialType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesQuality = filterQuality === 'all' || offCut.quality === filterQuality;
    const matchesWidth = minWidth === 0 || offCut.width >= minWidth;
    const matchesHeight = minHeight === 0 || offCut.height >= minHeight;
    return matchesSearch && matchesQuality && matchesWidth && matchesHeight;
  });

  const usableOffCuts = offCuts.filter(o => o.isUsable);
  const totalArea = offCuts.reduce((sum, o) => sum + o.area, 0);
  const usableArea = usableOffCuts.reduce((sum, o) => sum + o.area, 0);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Gestion des Chutes</h3>
            <p className="text-sm text-muted-foreground">
              {offCuts.length} chute(s) • {usableOffCuts.length} utilisable(s) • {totalArea.toFixed(0)} cm² total
            </p>
          </div>
          <Button onClick={() => setIsAddOffCutOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Chute
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="p-3 bg-green-50">
            <div className="flex items-center gap-2 mb-1">
              <Recycle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-600">Utilisables</span>
            </div>
            <p className="text-2xl font-bold">{usableOffCuts.length}</p>
            <p className="text-xs text-muted-foreground">{usableArea.toFixed(0)} cm²</p>
          </Card>
          
          <Card className="p-3 bg-orange-50">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-600">Non utilisables</span>
            </div>
            <p className="text-2xl font-bold">{offCuts.length - usableOffCuts.length}</p>
            <p className="text-xs text-muted-foreground">{(totalArea - usableArea).toFixed(0)} cm²</p>
          </Card>
          
          <Card className="p-3 bg-blue-50">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-blue-600">Taux utilisation</span>
            </div>
            <p className="text-2xl font-bold">
              {offCuts.length > 0 ? ((usableArea / totalArea) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Zone réutilisable</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div>
            <Label>Rechercher</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Type de matériau..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div>
            <Label>Qualité</Label>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
              value={filterQuality}
              onChange={(e) => setFilterQuality(e.target.value)}
            >
              <option value="all">Toutes</option>
              <option value="excellent">Excellent</option>
              <option value="good">Bon</option>
              <option value="fair">Moyen</option>
              <option value="poor">Faible</option>
            </select>
          </div>
          <div>
            <Label>Largeur min (cm)</Label>
            <Input
              type="number"
              value={minWidth || ''}
              onChange={(e) => setMinWidth(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Hauteur min (cm)</Label>
            <Input
              type="number"
              value={minHeight || ''}
              onChange={(e) => setMinHeight(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>

        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {filteredOffCuts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Recycle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune chute trouvée</p>
              </div>
            ) : (
              filteredOffCuts.map(offCut => (
                <Card key={offCut.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{offCut.materialType}</h4>
                        <Badge className={getQualityColor(offCut.quality)}>
                          {getQualityLabel(offCut.quality)}
                        </Badge>
                        {offCut.isUsable ? (
                          <Badge className="bg-green-500">Utilisable</Badge>
                        ) : (
                          <Badge className="bg-red-500">Non utilisable</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Dimensions: {offCut.width} × {offCut.height} × {offCut.thickness} cm
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        Surface: <span className="font-semibold">{offCut.area.toFixed(0)} cm²</span>
                      </p>
                      {offCut.location && (
                        <p className="text-sm text-muted-foreground">
                          Emplacement: {offCut.location}
                        </p>
                      )}
                      {offCut.sourceOrder && (
                        <p className="text-sm text-muted-foreground">
                          Commande source: {offCut.sourceOrder}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Ajouté le: {new Date(offCut.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {offCut.isUsable && (
                        <Button
                          size="sm"
                          onClick={() => {
                            onUseOffCut(offCut);
                            toast.success('Chute utilisée!');
                          }}
                        >
                          <Recycle className="w-4 h-4 mr-1" />
                          Utiliser
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Supprimer cette chute?')) {
                            onDeleteOffCut(offCut.id);
                            toast.success('Chute supprimée');
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

      {/* Add OffCut Dialog */}
      <Dialog open={isAddOffCutOpen} onOpenChange={setIsAddOffCutOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter une Chute</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de Matériau *</Label>
                <Input
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  placeholder="Marbre blanc, Granit..."
                />
              </div>
              <div>
                <Label>Qualité *</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as any)}
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Bon</option>
                  <option value="fair">Moyen</option>
                  <option value="poor">Faible</option>
                </select>
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

            {width > 0 && height > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Surface calculée: <span className="font-bold">{(width * height).toFixed(2)} cm²</span>
                </p>
                {width >= 10 && height >= 10 ? (
                  <p className="text-sm text-green-600 mt-1">✓ Chute utilisable</p>
                ) : (
                  <p className="text-sm text-orange-600 mt-1">⚠ Chute trop petite (min 10×10 cm)</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Emplacement</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Zone de stockage..."
                />
              </div>
              <div>
                <Label>Commande source</Label>
                <Input
                  value={sourceOrder}
                  onChange={(e) => setSourceOrder(e.target.value)}
                  placeholder="CMD-xxxxx"
                />
              </div>
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
                setIsAddOffCutOpen(false);
                resetForm();
              }}>
                Annuler
              </Button>
              <Button onClick={handleAddOffCut}>
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
