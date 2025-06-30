import FloodFill from "q-floodfill";
import { isoContours } from "marching-squares";
import simplify from "simplify-js";

export function floodFillToPolygon(
  imageData,
  startX,
  startY,
  fillTol = 0,
  simplifyTol = 0
) {
  const { width, height } = imageData;

  // Validate coordinates
  if (typeof startX !== 'number' || typeof startY !== 'number' || 
      isNaN(startX) || isNaN(startY)) {
    console.error('Invalid coordinates:', startX, startY);
    return [];
  }

  const roundedX = Math.round(startX);
  const roundedY = Math.round(startY);

  if (roundedX < 0 || roundedX >= width || roundedY < 0 || roundedY >= height) {
    console.error('Coordinates out of bounds:', roundedX, roundedY, 'bounds:', width, height);
    return [];
  }

  // Create a copy of the ImageData to avoid modifying the original
  const imageDataCopy = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  // Flood‑fill with q‑floodfill on the copy
  const floodFill = new FloodFill(imageDataCopy);
  floodFill.collectModifiedPixels = true;

  const startPixel = floodFill.getColorAtPixel(imageData, roundedX, roundedY);
  console.log('Starting pixel color:', startPixel);
  console.log('Fill tolerance:', fillTol);

  // Convert startPixel object to CSS color string
  const startColor = 'rgba(255,0,255,255)';
  console.log('Using fill color:', startColor);

  floodFill.fill(startColor, roundedX, roundedY, fillTol);

  console.log('Start coordinates:', roundedX, roundedY);
  console.log('Image dimensions:', width, height);
  console.log('Modified pixels count:', floodFill.modifiedPixels?.size || 0);
  console.log('Sample of modified pixels:', Array.from(floodFill.modifiedPixels || []).slice(0, 5));

  // Check if any pixels were modified
  if (!floodFill.modifiedPixels || floodFill.modifiedPixels.size === 0) {
    console.warn('No pixels were modified by flood fill');
    return [];
  }

  // Create a visual representation of modified pixels
  function visualizeModifiedPixels() {
    // Create a new ImageData for visualization
    const visualData = new ImageData(width, height);
    
    // Fill with transparent
    for (let i = 0; i < visualData.data.length; i += 4) {
      visualData.data[i] = 0;     // R
      visualData.data[i + 1] = 0; // G
      visualData.data[i + 2] = 0; // B
      visualData.data[i + 3] = 0; // A (transparent)
    }
    
    // Mark modified pixels in red
    for (const key of floodFill.modifiedPixels) {
      const [x, y] = key.split("|").map(Number);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const index = (y * width + x) * 4;
        visualData.data[index] = 255;     // R
        visualData.data[index + 1] = 0;   // G
        visualData.data[index + 2] = 0;   // B
        visualData.data[index + 3] = 255; // A (opaque)
      }
    }
    
    // Create a canvas and draw the visualization
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(visualData, 0, 0);
    
    const dataUrl = canvas.toDataURL();
    console.log('Modified pixels visualization:', dataUrl);
    
    // You can also append the canvas to the page temporarily
    canvas.style.position = 'fixed';
    canvas.style.top = '10px';
    canvas.style.left = '10px';
    canvas.style.zIndex = '9999';
    canvas.style.border = '2px solid red';
    document.body.appendChild(canvas);
    
    // Remove after 5 seconds
    setTimeout(() => canvas.remove(), 5000);
  }

  // Call the visualization function
  visualizeModifiedPixels();

  // Build binary mask
  const mask = new Uint8Array(width * height);
  for (const key of floodFill.modifiedPixels) {
    const [x, y] = key.split("|").map(Number);
    if (x >= 0 && x < width && y >= 0 && y < height) {
      mask[y * width + x] = 1;
    }
  }

  // Create 2D grid - ensure it's arrays of numbers
  const grid = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => mask[y * width + x])
  );

  const contours = isoContours(grid, [0.5]);
  console.log('Contours found:', contours.length);
  if (!contours.length) return [];

  const contour = contours[0];
  console.log('Contour rings:', contour.length);

  const sortedRings = contour
    .map(ring => ({
      ring,
      length: ring.length
    }))
    .sort((a, b) => b.length - a.length);

  console.log('Ring sizes:', sortedRings.map(r => r.length));

  // Convert all rings to point objects
  const allRings = sortedRings.map(({ring}) => {
    const pointObjects = ring.map(point => ({ 
      x: Math.round(point[0]), 
      y: Math.round(point[1]) 
    }));
    return simplify(pointObjects, simplifyTol, true);
  });

  console.log('Processed rings:', allRings.map(ring => ring.length));

  return allRings;
}
