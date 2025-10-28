import { useEffect, useRef } from 'react';
import { Piece, SlabDimensions } from '@/types/shapes';

interface OptimizerCanvasProps {
  pieces: Piece[];
  slab: SlabDimensions;
  onPieceClick: (piece: Piece) => void;
}

export const OptimizerCanvas = ({ pieces, slab, onPieceClick }: OptimizerCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const padding = 60;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;
    
    const scaleX = availableWidth / slab.width;
    const scaleY = availableHeight / slab.height;
    const scale = Math.min(scaleX, scaleY, 1);
    
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
    ctx.fillText(`Longueur: ${slab.width}mm`, offsetX + scaledWidth / 2, offsetY - 30);
    ctx.save();
    ctx.translate(offsetX - 30, offsetY + scaledHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`Largeur: ${slab.height}mm`, 0, 0);
    ctx.restore();
    
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
      
      ctx.fillStyle = piece.color || 'hsl(var(--piece-fill-1))';
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
      
      // Draw coordinates
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`(${Math.round(piece.x)}, ${Math.round(piece.y)})`, x + w / 2, y + h / 2 + 15);
    });
    
  }, [pieces, slab]);
  
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
    ctx.fillText(`${piece.width}mm`, x + w / 2, y - measurementOffset - measurementTextOffset);

    // Vertical measurement
    ctx.beginPath();
    ctx.moveTo(x - measurementOffset, y);
    ctx.lineTo(x - measurementOffset, y + h);
    ctx.stroke();
    ctx.save();
    ctx.translate(x - measurementOffset - measurementTextOffset, y + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${piece.height}mm`, 0, 0);
    ctx.restore();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const padding = 60;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;
    
    const scaleX = availableWidth / slab.width;
    const scaleY = availableHeight / slab.height;
    const scale = Math.min(scaleX, scaleY, 1);
    
    const scaledWidth = slab.width * scale;
    const scaledHeight = slab.height * scale;
    const offsetX = padding + (availableWidth - scaledWidth) / 2;
    const offsetY = padding + (availableHeight - scaledHeight) / 2;
    
    for (const piece of pieces) {
      if (piece.x === undefined || piece.y === undefined) continue;
      
      const x = offsetX + piece.x * scale;
      const y = offsetY + piece.y * scale;
      const w = piece.width * scale;
      const h = piece.height * scale;
      
      if (clickX >= x && clickX <= x + w && clickY >= y && clickY <= y + h) {
        onPieceClick(piece);
        break;
      }
    }
  };
  
  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={800}
      onClick={handleCanvasClick}
      className="w-full h-auto border-2 border-primary rounded-lg cursor-pointer shadow-lg"
      style={{ background: '#ffffff' }}
    />
  );
};
