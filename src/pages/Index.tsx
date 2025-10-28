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
import { Piece, ShapeType, OptimizationResult, SlabDimensions } from '@/types/shapes';
import { optimizeCutting } from '@/utils/maxrects';
import { toast } from 'sonner';
import { Play, Loader2, Camera } from 'lucide-react';

const Index = () => {
  const [slab, setSlab] = useState<SlabDimensions>({ width: 3000, height: 1400 });
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const addShape = (type: ShapeType) => {
    const defaults: Record<ShapeType, Partial<Piece>> = {
      'rectangle': { width: 300, height: 200 },
      'l-left': { width: 400, height: 300, cutWidth: 150, cutHeight: 100 },
      'l-right': { width: 400, height: 300, cutWidth: 150, cutHeight: 100 },
      't-shape': { width: 400, height: 300, topWidth: 400, stemWidth: 150 },
      'circle': { radius: 150, width: 300, height: 300 },
      'triangle': { base: 300, triangleHeight: 250, width: 300, height: 250 },
      'custom': { width: 300, height: 200 },
    };

    const newPiece: Piece = {
      id: crypto.randomUUID(),
      type,
      ...defaults[type],
      width: defaults[type].width || 300,
      height: defaults[type].height || 200,
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
    setPieces(pieces.map(p => p.id === editedPiece.id ? editedPiece : p));
    toast.success('Pièce mise à jour!');
  };

  const handleCapture = (imageData: string) => {
    // Mock measurement extraction
    console.log('Captured image data:', imageData.substring(0, 30) + '...');
    toast.info('Analyse de l\'image en cours...');
    setTimeout(() => {
      const mockWidth = Math.floor(Math.random() * 1000) + 2000;
      const mockHeight = Math.floor(Math.random() * 500) + 1000;
      setSlab({ width: mockWidth, height: mockHeight });
      toast.success(`Dimensions mises à jour: ${mockWidth}x${mockHeight}mm`);
    }, 1500);
  };

  const runOptimization = () => {
    if (pieces.length === 0) {
      toast.error('Ajoutez au moins une pièce!');
      return;
    }

    setIsOptimizing(true);
    
    setTimeout(() => {
      const result = optimizeCutting(pieces, slab);
      setOptimizationResult(result);
      setIsOptimizing(false);
      
      if (result.unplacedPieces.length > 0) {
        toast.warning(`${result.unplacedPieces.length} pièce(s) non placée(s)`);
      } else {
        toast.success(`Optimisation réussie! Efficacité: ${result.efficiency}%`);
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
            Optimisez automatiquement la découpe de vos pièces avec l'algorithme MaxRects
          </p>
        </div>

        {/* Slab Dimensions */}
        <Card className="p-4 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Dimensions de la Dalle</h3>
            <Button variant="outline" size="sm" onClick={() => setIsCameraOpen(true)}>
              <Camera className="w-4 h-4 mr-2" />
              Capturer les Mesures
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <Label htmlFor="slabWidth">Longueur (mm)</Label>
              <Input
                id="slabWidth"
                type="number"
                value={slab.width}
                onChange={(e) => setSlab({ ...slab, width: parseFloat(e.target.value) })}
                min={100}
              />
            </div>
            <div>
              <Label htmlFor="slabHeight">Largeur (mm)</Label>
              <Input
                id="slabHeight"
                type="number"
                value={slab.height}
                onChange={(e) => setSlab({ ...slab, height: parseFloat(e.target.value) })}
                min={100}
              />
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
                onPieceClick={(piece) => {
                  setSelectedPiece(piece);
                  setIsEditModalOpen(true);
                }}
                onPieceMove={handlePieceMove}
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
            <PiecesList pieces={pieces} onRemove={removePiece} />
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
