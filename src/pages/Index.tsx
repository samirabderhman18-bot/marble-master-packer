import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { OptimizerCanvas } from '@/components/OptimizerCanvas';
import { ShapeLibrary } from '@/components/ShapeLibrary';
import { PiecesList } from '@/components/PiecesList';
import { Statistics } from '@/components/Statistics';
import { EditPieceModal } from '@/components/EditPieceModal';
import { CustomShapeCreator } from '@/components/CustomShapeCreator';
import { CameraCapture } from '@/components/CameraCapture';
import { Piece, ShapeType, OptimizationResult, SlabDimensions, OptimizationGoal } from '@/types/shapes';
import { optimizeCutting } from '@/utils/maxrects';
import { toast } from 'sonner';
import { Play, Loader2, Camera } from 'lucide-react';

const Index = () => {
  const [unit, setUnit] = useState<'cm' | 'mm'>('cm');
  const [slab, setSlab] = useState<SlabDimensions>({ 
    width: 300, 
    height: 140, 
    margin: 1,
    minSpacing: 0.5,
    grainDirection: 'none',
    defects: []
  });
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>('waste-reduction');
  
  const convertToUnit = (value: number) => unit === 'mm' ? value * 10 : value;
  const convertFromUnit = (value: number) => unit === 'mm' ? value / 10 : value;

  const addShape = (type: ShapeType) => {
    const defaults: Record<ShapeType, Partial<Piece>> = {
      'rectangle': { width: 30, height: 20 },
      'l-left': { width: 40, height: 30, cutWidth: 15, cutHeight: 10 },
      'l-right': { width: 40, height: 30, cutWidth: 15, cutHeight: 10 },
      't-shape': { width: 40, height: 30, topWidth: 40, stemWidth: 15 },
      'circle': { radius: 15, width: 30, height: 30 },
      'triangle': { base: 30, triangleHeight: 25, width: 30, height: 25 },
      'custom': { width: 30, height: 20 },
    };

    const newPiece: Piece = {
      id: crypto.randomUUID(),
      type,
      ...defaults[type],
      width: defaults[type].width || 30,
      height: defaults[type].height || 20,
      priority: 1,
      grainDirection: 'none',
    };

    setPieces([...pieces, newPiece]);
    toast.success(`${type} ajouté!`);
  };

  const addCustomPiece = (piece: Piece) => {
    setPieces([...pieces, piece]);
    toast.success('Pièce personnalisée ajoutée!');
  };

  const removePiece = (id: string) => {
    setPieces(pieces.filter(p => p.id !== id));
    toast.info('Pièce supprimée');
  };

  const handlePieceMove = (piece: Piece, x: number, y: number) => {
    const updatedPieces = pieces.map(p =>
      p.id === piece.id ? { ...p, x, y } : p
    );
    setPieces(updatedPieces.filter(p => p.x !== undefined && p.y !== undefined));
  };

  const handleSavePiece = (editedPiece: Piece) => {
    setPieces(pieces.map(p => p.id === editedPiece.id ? { ...editedPiece, x: undefined, y: undefined } : p));
    toast.success('Pièce mise à jour!');
  };
  
  const handlePieceRotate = (piece: Piece) => {
    const rotatedPiece: Piece = {
      ...piece,
      width: piece.height,
      height: piece.width,
      rotated: !piece.rotated,
    };
    setPieces(pieces.map(p => p.id === piece.id ? rotatedPiece : p));
    toast.success('Pièce pivotée!');
  };

  const handleCapture = (imageData: string) => {
    console.log('Captured image data:', imageData.substring(0, 30) + '...');
    toast.info('Analyse de l\'image en cours...');
    setTimeout(() => {
      const mockWidth = Math.floor(Math.random() * 100) + 200;
      const mockHeight = Math.floor(Math.random() * 50) + 100;
      const finalWidth = unit === 'mm' ? mockWidth * 10 : mockWidth;
      const finalHeight = unit === 'mm' ? mockHeight * 10 : mockHeight;
      setSlab({ ...slab, width: finalWidth, height: finalHeight });
      toast.success(`Dimensions mises à jour: ${mockWidth}x${mockHeight}${unit}`);
    }, 1500);
  };

  const runOptimization = () => {
    if (pieces.length === 0) {
      toast.error('Ajoutez au moins une pièce!');
      return;
    }

    setIsOptimizing(true);
    
    setTimeout(() => {
      const result = optimizeCutting(pieces, slab, optimizationGoal);
      setOptimizationResult(result);
      setIsOptimizing(false);
      
      const message = `${result.combinationsTested.toLocaleString()} combinaisons testées`;
      
      if (result.unplacedPieces.length > 0) {
        toast.warning(`${result.unplacedPieces.length} pièce(s) non placée(s). ${message}`);
      } else {
        toast.success(`Efficacité: ${result.efficiency}% (cible: 70-85%). ${message}`);
      }
    }, 800);
  };

  const pieceCount = pieces.length;
  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    if (pieceCount > 0) {
      runOptimization();
    } else {
      setOptimizationResult(null);
    }
  }, [pieceCount, slab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Optimiseur de Découpe de Marbre
          </h1>
          <p className="text-muted-foreground">
            Testez des milliers de combinaisons pour maximiser l'utilisation de matériau (cible: 70-85%)
          </p>
        </div>

        {/* Slab Dimensions & Settings */}
        <Card className="p-4 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Configuration de la Dalle</h3>
            <div className="flex gap-2">
              <div className="flex rounded-md border border-input">
                <button
                  onClick={() => setUnit('cm')}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    unit === 'cm' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
                  }`}
                >
                  cm
                </button>
                <button
                  onClick={() => setUnit('mm')}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    unit === 'mm' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
                  }`}
                >
                  mm
                </button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsCameraOpen(true)}>
                <Camera className="w-4 h-4 mr-2" />
                Capturer
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="slabWidth">Longueur ({unit})</Label>
              <Input
                id="slabWidth"
                type="number"
                value={convertToUnit(slab.width)}
                onChange={(e) => setSlab({ ...slab, width: convertFromUnit(parseFloat(e.target.value)) })}
                min={1}
                step={unit === 'mm' ? 1 : 0.1}
              />
            </div>
            <div>
              <Label htmlFor="slabHeight">Largeur ({unit})</Label>
              <Input
                id="slabHeight"
                type="number"
                value={convertToUnit(slab.height)}
                onChange={(e) => setSlab({ ...slab, height: convertFromUnit(parseFloat(e.target.value)) })}
                min={1}
                step={unit === 'mm' ? 1 : 0.1}
              />
            </div>
            <div>
              <Label htmlFor="margin">Marge ({unit})</Label>
              <Input
                id="margin"
                type="number"
                value={convertToUnit(slab.margin || 1)}
                onChange={(e) => setSlab({ ...slab, margin: convertFromUnit(parseFloat(e.target.value)) })}
                min={0}
                step={unit === 'mm' ? 1 : 0.1}
              />
            </div>
            <div>
              <Label htmlFor="spacing">Espacement ({unit})</Label>
              <Input
                id="spacing"
                type="number"
                value={convertToUnit(slab.minSpacing || 0.5)}
                onChange={(e) => setSlab({ ...slab, minSpacing: convertFromUnit(parseFloat(e.target.value)) })}
                min={0}
                step={unit === 'mm' ? 1 : 0.1}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="grain">Direction du Grain</Label>
              <select
                id="grain"
                value={slab.grainDirection || 'none'}
                onChange={(e) => setSlab({ ...slab, grainDirection: e.target.value as any })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="none">Aucune</option>
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </div>
            <div>
              <Label htmlFor="goal">Objectif d'Optimisation</Label>
              <select
                id="goal"
                value={optimizationGoal}
                onChange={(e) => setOptimizationGoal(e.target.value as OptimizationGoal)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="waste-reduction">Réduction des Chutes</option>
                <option value="production-speed">Vitesse de Production</option>
                <option value="aesthetic-matching">Correspondance Esthétique</option>
                <option value="cost-efficiency">Efficacité des Coûts</option>
              </select>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-[1fr_350px] gap-6">
          {/* Main Canvas Area */}
          <div className="space-y-4">
            <Card className="p-4 shadow-lg">
              {isOptimizing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-lg font-semibold">Optimisation en cours...</p>
                  </div>
                </div>
              )}
              <OptimizerCanvas
                pieces={optimizationResult?.pieces || []}
                slab={slab}
                unit={unit}
                onPieceClick={(piece) => {
                  setSelectedPiece(piece);
                  setIsEditModalOpen(true);
                }}
                onPieceMove={handlePieceMove}
                onPieceRotate={handlePieceRotate}
              />
            </Card>

            <Button 
              onClick={runOptimization} 
              size="lg" 
              className="w-full"
              disabled={pieces.length === 0 || isOptimizing}
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Optimisation...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Lancer l'Optimisation
                </>
              )}
            </Button>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            <ShapeLibrary onAddShape={addShape} />
            <CustomShapeCreator onAdd={addCustomPiece} />
            <PiecesList pieces={pieces} onRemove={removePiece} unit={unit} />
            <Statistics result={optimizationResult} totalArea={slab.width * slab.height} />
          </div>
        </div>
      </div>

      <EditPieceModal
        piece={selectedPiece}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSavePiece}
      />

      <CameraCapture
        open={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
      />
    </div>
  );
};

export default Index;
