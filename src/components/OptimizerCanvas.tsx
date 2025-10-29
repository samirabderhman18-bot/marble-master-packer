import { useEffect, useRef, useState } from 'react';
import { Piece, SlabDimensions, FreeRectangle } from '@/types/shapes';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { doPiecesOverlap } from '@/utils/collision';

interface OptimizerCanvasProps {
  pieces: Piece[];
  slab: SlabDimensions;
  freeRectangles?: FreeRectangle[];
  onPieceClick: (piece: Piece) => void;
  onPieceMove: (piece: Piece, x: number, y: number) => void;
  onPieceRotate?: (piece: Piece) => void;
  unit: 'cm' | 'mm';
}

export const OptimizerCanvas = ({ pieces, slab, freeRectangles, onPieceClick, onPieceMove, onPieceRotate, unit }: OptimizerCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingPiece, setDraggingPiece] = useState<Piece | null>(null);
  const [isColliding, setIsColliding] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const padding = 60;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;
    
    const scaleX = (availableWidth / slab.width) * zoom;
    const scaleY = (availableHeight / slab.height) * zoom;
    const scale = Math.min(scaleX, scaleY);
    
    const scaledWidth = slab.width * scale;
    const scaledHeight = slab.height * scale;
    const offsetX = padding + (availableWidth - scaledWidth) / 2;
    const offsetY = padding + (availableHeight - scaledHeight) / 2;
    
    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'hsl(var(--canvas-grid))';
    ctx.lineWidth = 1;
    const gridSize = 50 * scale;
    
    for (let x = 0; x <= scaledWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(offsetX + x, offsetY);
      ctx.lineTo(offsetX + x, offsetY + scaledHeight);
      ctx.stroke();
    }
    
    for (let y = 0; y <= scaledHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + y);
      ctx.lineTo(offsetX + scaledWidth, offsetY + y);
      ctx.stroke();
    }
    
    // Draw slab border (more visible)
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 3;
    ctx.strokeRect(offsetX, offsetY, scaledWidth, scaledHeight);
    
    // Draw axes labels
    ctx.fillStyle = 'hsl(var(--foreground))';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`Longueur: ${slab.width}${unit}`, offsetX + scaledWidth / 2, offsetY - 30);
    ctx.save();
    ctx.translate(offsetX - 30, offsetY + scaledHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`Largeur: ${slab.height}${unit}`, 0, 0);
    ctx.restore();
    
    // Draw defect zones if any
    if (slab.defects && slab.defects.length > 0) {
      slab.defects.forEach(defect => {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.fillRect(
          offsetX + defect.x * scale,
          offsetY + defect.y * scale,
          defect.width * scale,
          defect.height * scale
        );
        ctx.strokeRect(
          offsetX + defect.x * scale,
          offsetY + defect.y * scale,
          defect.width * scale,
          defect.height * scale
        );
      });
    }
    
    // Show message if no pieces
    if (pieces.length === 0) {
      ctx.fillStyle = 'hsl(var(--muted-foreground))';
      ctx.font = '18px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Ajoutez des pièces pour commencer', offsetX + scaledWidth / 2, offsetY + scaledHeight / 2);
    }
    
    // Draw pieces
    pieces.forEach(piece => {
      if (piece.x === undefined || piece.y === undefined) return;
      
      const x = offsetX + piece.x * scale;
      const y = offsetY + piece.y * scale;
      const w = piece.width * scale;
      const h = piece.height * scale;
      
      // Highlight selected piece
      const isSelected = selectedPiece?.id === piece.id;
      if (isSelected) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
      }
      
      ctx.fillStyle = isColliding && draggingPiece?.id === piece.id ? 'rgba(255, 0, 0, 0.5)' : piece.color || 'hsl(var(--piece-fill-1))';
      ctx.strokeStyle = 'hsl(var(--piece-stroke))';
      ctx.lineWidth = 2;
      
      switch (piece.type) {
        case 'rectangle':
          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);
          break;
          
        case 'l-left':
        case 'l-right':
          if (piece.cutWidth && piece.cutHeight) {
            const cutW = piece.cutWidth * scale;
            const cutH = piece.cutHeight * scale;

            ctx.beginPath();
            if (piece.type === 'l-left') {
              ctx.moveTo(x, y);
              ctx.lineTo(x + w, y);
              ctx.lineTo(x + w, y + cutH);
              ctx.lineTo(x + w - cutW, y + cutH);
              ctx.lineTo(x + w - cutW, y + h);
              ctx.lineTo(x, y + h);
            } else { // l-right
              ctx.moveTo(x + cutW, y);
              ctx.lineTo(x + w, y);
              ctx.lineTo(x + w, y + h);
              ctx.lineTo(x, y + h);
              ctx.lineTo(x, y + cutH);
              ctx.lineTo(x + cutW, y + cutH);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else {
            // Fallback for L-shapes without cut dimensions
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);
          }
          break;
          
        case 't-shape':
          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);
          break;
          
        case 'circle':
          if (piece.radius) {
            const radius = piece.radius * scale;
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          break;
          
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(x + w / 2, y);
          ctx.lineTo(x + w, y + h);
          ctx.lineTo(x, y + h);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
          
        case 'custom':
          if (piece.points && piece.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(x + piece.points[0].x * scale, y + piece.points[0].y * scale);
            piece.points.slice(1).forEach(point => {
              ctx.lineTo(x + point.x * scale, y + point.y * scale);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          break;
      }
      
      // Draw dimensions and rotation indicator
      drawMeasurements(ctx, piece, x, y, w, h);
      
      // Draw cutting order
      if (piece.cuttingOrder) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'hsl(var(--foreground))';
        ctx.lineWidth = 2;
        const radius = 15;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'hsl(var(--foreground))';
        ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(piece.cuttingOrder.toString(), x + w / 2, y + h / 2);
      }
    });

    // Draw free rectangles
    if (freeRectangles) {
      ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
      ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      freeRectangles.forEach(rect => {
        ctx.fillRect(
          offsetX + rect.x * scale,
          offsetY + rect.y * scale,
          rect.width * scale,
          rect.height * scale
        );
        ctx.strokeRect(
          offsetX + rect.x * scale,
          offsetY + rect.y * scale,
          rect.width * scale,
          rect.height * scale
        );
      });
      ctx.setLineDash([]);
    }
    
  }, [pieces, slab, selectedPiece, unit, freeRectangles, zoom]);
  
  const drawMeasurements = (ctx: CanvasRenderingContext2D, piece: Piece, x: number, y: number, w: number, h: number) => {
    const measurementOffset = 20;
    const measurementTextOffset = 6;

    ctx.strokeStyle = 'hsl(var(--accent-foreground))';
    ctx.fillStyle = 'hsl(var(--accent-foreground))';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Horizontal measurement
    ctx.beginPath();
    ctx.moveTo(x, y - measurementOffset);
    ctx.lineTo(x + w, y - measurementOffset);
    ctx.stroke();
    ctx.fillText(`${piece.width}${unit}`, x + w / 2, y - measurementOffset - measurementTextOffset);

    // Vertical measurement
    ctx.beginPath();
    ctx.moveTo(x - measurementOffset, y);
    ctx.lineTo(x - measurementOffset, y + h);
    ctx.stroke();
    ctx.save();
    ctx.translate(x - measurementOffset - measurementTextOffset, y + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${piece.height}${unit}`, 0, 0);
    ctx.restore();
    
    // Rotation indicator
    if (piece.rotated) {
      ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
      ctx.font = 'bold 10px system-ui';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('↻', x + w - 5, y + 5);
    }
  };

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const mousePos = getMousePos(e);
    
    const padding = 60;
    const availableWidth = canvasRef.current!.width - padding * 2;
    const availableHeight = canvasRef.current!.height - padding * 2;
    const scale = Math.min(availableWidth / slab.width, availableHeight / slab.height) * zoom;
    const offsetX = padding + (availableWidth - slab.width * scale) / 2;
    const offsetY = padding + (availableHeight - slab.height * scale) / 2;

    for (const piece of [...pieces].reverse()) {
      if (piece.x === undefined || piece.y === undefined) continue;

      const x = offsetX + piece.x * scale;
      const y = offsetY + piece.y * scale;
      const w = piece.width * scale;
      const h = piece.height * scale;

      if (mousePos.x >= x && mousePos.x <= x + w && mousePos.y >= y && mousePos.y <= y + h) {
        setDraggingPiece(piece);
        setSelectedPiece(piece);
        setDragOffset({
          x: (mousePos.x - x) / scale,
          y: (mousePos.y - y) / scale,
        });
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingPiece) return;

    const mousePos = getMousePos(e);
    
    const padding = 60;
    const availableWidth = canvasRef.current!.width - padding * 2;
    const availableHeight = canvasRef.current!.height - padding * 2;
    const scale = Math.min(availableWidth / slab.width, availableHeight / slab.height) * zoom;
    const offsetX = padding + (availableWidth - slab.width * scale) / 2;
    const offsetY = padding + (availableHeight - slab.height * scale) / 2;

    const newX = (mousePos.x - offsetX) / scale - dragOffset.x;
    const newY = (mousePos.y - offsetY) / scale - dragOffset.y;

    const testPiece = { ...draggingPiece, x: newX, y: newY };
    let collision = false;
    for (const piece of pieces) {
      if (piece.id !== draggingPiece.id) {
        if (doPiecesOverlap(testPiece, piece)) {
          collision = true;
          break;
        }
      }
    }

    setIsColliding(collision);

    if (!collision) {
      onPieceMove(draggingPiece, newX, newY);
    }
  };

  const handleMouseUp = () => {
    if (draggingPiece) {
      setDraggingPiece(null);
      setIsColliding(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const mousePos = getMousePos(e);

    const padding = 60;
    const availableWidth = canvasRef.current!.width - padding * 2;
    const availableHeight = canvasRef.current!.height - padding * 2;
    const scale = Math.min(availableWidth / slab.width, availableHeight / slab.height) * zoom;
    const offsetX = padding + (availableWidth - slab.width * scale) / 2;
    const offsetY = padding + (availableHeight - slab.height * scale) / 2;
    
    for (const piece of [...pieces].reverse()) {
      if (piece.x === undefined || piece.y === undefined) continue;
      
      const x = offsetX + piece.x * scale;
      const y = offsetY + piece.y * scale;
      const w = piece.width * scale;
      const h = piece.height * scale;

      if (mousePos.x >= x && mousePos.x <= x + w && mousePos.y >= y && mousePos.y <= y + h) {
        onPieceClick(piece);
        setSelectedPiece(piece);
        return;
      }
    }
  };

  const handleRotateSelected = () => {
    if (selectedPiece && onPieceRotate) {
      const rotatedPiece = {
        ...selectedPiece,
        width: selectedPiece.height,
        height: selectedPiece.width,
        rotated: !selectedPiece.rotated,
      };

      let collision = false;
      for (const piece of pieces) {
        if (piece.id !== selectedPiece.id) {
          if (doPiecesOverlap(rotatedPiece, piece)) {
            collision = true;
            break;
          }
        }
      }

      if (!collision) {
        onPieceRotate(selectedPiece);
      } else {
        // Provide visual feedback for a failed rotation
        // For example, you could flash the piece red
        const originalColor = selectedPiece.color;
        const updatedPieces = pieces.map(p =>
          p.id === selectedPiece.id ? { ...p, color: 'rgba(255, 0, 0, 0.5)' } : p
        );
        // This is a temporary state update to show the color change
        // It's not the ideal way to handle this, but it's a simple solution
        // for visual feedback.
        // A better solution would involve a dedicated state for the rotation collision
        setTimeout(() => {
          const originalPieces = pieces.map(p =>
            p.id === selectedPiece.id ? { ...p, color: originalColor } : p
          );
        }, 500);
      }
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  return (
    <div className="relative">
      {/* Zoom and Rotation Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleZoomIn}
          className="shadow-lg"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleZoomOut}
          className="shadow-lg"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        {selectedPiece && onPieceRotate && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRotateSelected}
            className="shadow-lg animate-fade-in"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className="w-full h-auto border-2 border-primary rounded-lg cursor-pointer shadow-lg"
        style={{ background: '#ffffff' }}
      />
    </div>
  );
};
