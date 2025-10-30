import { Piece } from '@/types/shapes';

/**
 * Generates a DXF file content from pieces
 * DXF format compatible with AlphaCAM and most CAM software
 */
export const generateDXF = (pieces: Piece[], unit: 'cm' | 'mm'): string => {
  const scale = unit === 'cm' ? 10 : 1; // Convert to mm for DXF standard
  
  let dxf = '';
  
  // Header Section
  dxf += '0\nSECTION\n';
  dxf += '2\nHEADER\n';
  dxf += '9\n$ACADVER\n1\nAC1015\n'; // AutoCAD 2000 format
  dxf += '9\n$INSUNITS\n70\n4\n'; // 4 = millimeters
  dxf += '0\nENDSEC\n';
  
  // Tables Section
  dxf += '0\nSECTION\n';
  dxf += '2\nTABLES\n';
  dxf += '0\nTABLE\n';
  dxf += '2\nLAYER\n';
  dxf += '70\n1\n'; // Max number of layers
  
  // Create layers for each piece type
  const layerNames = ['RECTANGLES', 'L_SHAPES', 'CIRCLES', 'TRIANGLES', 'CUSTOM'];
  layerNames.forEach((layerName, index) => {
    dxf += '0\nLAYER\n';
    dxf += '2\n' + layerName + '\n';
    dxf += '70\n0\n';
    dxf += `62\n${index + 1}\n`; // Color number
  });
  
  dxf += '0\nENDTAB\n';
  dxf += '0\nENDSEC\n';
  
  // Entities Section
  dxf += '0\nSECTION\n';
  dxf += '2\nENTITIES\n';
  
  pieces.forEach((piece, index) => {
    const x = (piece.x || 0) * scale;
    const y = (piece.y || 0) * scale;
    
    switch (piece.type) {
      case 'rectangle':
        dxf += createRectangleDXF(x, y, piece.width * scale, piece.height * scale, 'RECTANGLES');
        break;
        
      case 'l-left':
      case 'l-right':
        dxf += createLShapeDXF(
          x, y,
          piece.width * scale,
          piece.height * scale,
          (piece.cutWidth || 0) * scale,
          (piece.cutHeight || 0) * scale,
          piece.type === 'l-right',
          'L_SHAPES'
        );
        break;
        
      case 'circle':
        dxf += createCircleDXF(x, y, (piece.radius || piece.width / 2) * scale, 'CIRCLES');
        break;
        
      case 'triangle':
        dxf += createTriangleDXF(
          x, y,
          (piece.base || piece.width) * scale,
          (piece.triangleHeight || piece.height) * scale,
          'TRIANGLES'
        );
        break;
        
      case 't-shape':
        dxf += createTShapeDXF(
          x, y,
          piece.width * scale,
          piece.height * scale,
          (piece.topWidth || piece.width) * scale,
          (piece.stemWidth || piece.width / 3) * scale,
          'CUSTOM'
        );
        break;
        
      case 'custom':
        if (piece.points && piece.points.length > 0) {
          dxf += createCustomShapeDXF(
            piece.points.map(p => ({ x: (x + p.x * scale), y: (y + p.y * scale) })),
            'CUSTOM'
          );
        }
        break;
    }
    
    // Add piece label
    dxf += createTextDXF(x + 5, y + 5, `Piece_${index + 1}`, 3 * scale, 'RECTANGLES');
  });
  
  dxf += '0\nENDSEC\n';
  dxf += '0\nEOF\n';
  
  return dxf;
};

function createRectangleDXF(x: number, y: number, width: number, height: number, layer: string): string {
  let dxf = '0\nLWPOLYLINE\n';
  dxf += '8\n' + layer + '\n';
  dxf += '90\n5\n'; // Number of vertices
  dxf += '70\n1\n'; // Closed polyline
  
  const points = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
    [x, y] // Close the shape
  ];
  
  points.forEach(([px, py]) => {
    dxf += '10\n' + px.toFixed(3) + '\n';
    dxf += '20\n' + py.toFixed(3) + '\n';
  });
  
  return dxf;
}

function createLShapeDXF(
  x: number, y: number,
  width: number, height: number,
  cutWidth: number, cutHeight: number,
  isRight: boolean,
  layer: string
): string {
  let dxf = '0\nLWPOLYLINE\n';
  dxf += '8\n' + layer + '\n';
  dxf += '90\n7\n'; // Number of vertices
  dxf += '70\n1\n'; // Closed polyline
  
  let points;
  if (isRight) {
    // L-Right: cut is on top-right
    points = [
      [x, y],
      [x + width, y],
      [x + width, y + height - cutHeight],
      [x + width - cutWidth, y + height - cutHeight],
      [x + width - cutWidth, y + height],
      [x, y + height],
      [x, y]
    ];
  } else {
    // L-Left: cut is on top-left
    points = [
      [x, y],
      [x + width, y],
      [x + width, y + height],
      [x + cutWidth, y + height],
      [x + cutWidth, y + height - cutHeight],
      [x, y + height - cutHeight],
      [x, y]
    ];
  }
  
  points.forEach(([px, py]) => {
    dxf += '10\n' + px.toFixed(3) + '\n';
    dxf += '20\n' + py.toFixed(3) + '\n';
  });
  
  return dxf;
}

function createCircleDXF(x: number, y: number, radius: number, layer: string): string {
  let dxf = '0\nCIRCLE\n';
  dxf += '8\n' + layer + '\n';
  dxf += '10\n' + x.toFixed(3) + '\n';
  dxf += '20\n' + y.toFixed(3) + '\n';
  dxf += '30\n0.0\n';
  dxf += '40\n' + radius.toFixed(3) + '\n';
  return dxf;
}

function createTriangleDXF(x: number, y: number, base: number, height: number, layer: string): string {
  let dxf = '0\nLWPOLYLINE\n';
  dxf += '8\n' + layer + '\n';
  dxf += '90\n4\n'; // Number of vertices
  dxf += '70\n1\n'; // Closed polyline
  
  const points = [
    [x, y],
    [x + base, y],
    [x + base / 2, y + height],
    [x, y]
  ];
  
  points.forEach(([px, py]) => {
    dxf += '10\n' + px.toFixed(3) + '\n';
    dxf += '20\n' + py.toFixed(3) + '\n';
  });
  
  return dxf;
}

function createTShapeDXF(
  x: number, y: number,
  width: number, height: number,
  topWidth: number, stemWidth: number,
  layer: string
): string {
  let dxf = '0\nLWPOLYLINE\n';
  dxf += '8\n' + layer + '\n';
  dxf += '90\n9\n'; // Number of vertices
  dxf += '70\n1\n'; // Closed polyline
  
  const stemOffset = (topWidth - stemWidth) / 2;
  const topHeight = height / 2;
  
  const points = [
    [x, y + topHeight],
    [x, y + height],
    [x + topWidth, y + height],
    [x + topWidth, y + topHeight],
    [x + stemOffset + stemWidth, y + topHeight],
    [x + stemOffset + stemWidth, y],
    [x + stemOffset, y],
    [x + stemOffset, y + topHeight],
    [x, y + topHeight]
  ];
  
  points.forEach(([px, py]) => {
    dxf += '10\n' + px.toFixed(3) + '\n';
    dxf += '20\n' + py.toFixed(3) + '\n';
  });
  
  return dxf;
}

function createCustomShapeDXF(points: Array<{x: number, y: number}>, layer: string): string {
  let dxf = '0\nLWPOLYLINE\n';
  dxf += '8\n' + layer + '\n';
  dxf += '90\n' + (points.length + 1) + '\n'; // Number of vertices
  dxf += '70\n1\n'; // Closed polyline
  
  points.forEach(p => {
    dxf += '10\n' + p.x.toFixed(3) + '\n';
    dxf += '20\n' + p.y.toFixed(3) + '\n';
  });
  
  // Close the shape
  dxf += '10\n' + points[0].x.toFixed(3) + '\n';
  dxf += '20\n' + points[0].y.toFixed(3) + '\n';
  
  return dxf;
}

function createTextDXF(x: number, y: number, text: string, height: number, layer: string): string {
  let dxf = '0\nTEXT\n';
  dxf += '8\n' + layer + '\n';
  dxf += '10\n' + x.toFixed(3) + '\n';
  dxf += '20\n' + y.toFixed(3) + '\n';
  dxf += '30\n0.0\n';
  dxf += '40\n' + height.toFixed(3) + '\n';
  dxf += '1\n' + text + '\n';
  return dxf;
}

/**
 * Downloads the DXF file
 */
export const downloadDXF = (dxfContent: string, filename: string = 'pieces.dxf') => {
  const blob = new Blob([dxfContent], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
