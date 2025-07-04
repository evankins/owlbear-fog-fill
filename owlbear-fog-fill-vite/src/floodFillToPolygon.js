import FloodFill from "q-floodfill";
import { isoContours } from "marching-squares";
import simplify from "simplify-js";
import OBR, { buildCurve } from "@owlbear-rodeo/sdk";

export function floodFillToPolygon(
  imageData,
  startX,
  startY,
  fillTol = 100,
  simplifyTol = 5
) {
  const { width, height } = imageData;
  const roundedX = Math.round(startX);
  const roundedY = Math.round(startY);

  // Create a copy of the ImageData to avoid modifying the original
  const imageDataCopy = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  // Flood‑fill with q‑floodfill on the copy
  const floodFill = new FloodFill(imageDataCopy);
  floodFill.collectModifiedPixels = true;

  // Fill with red
  const startColor = 'rgba(255,0,255,255)';
  floodFill.fill(startColor, roundedX, roundedY, fillTol);

  // Check if any pixels were modified
  if (!floodFill.modifiedPixels || floodFill.modifiedPixels.size === 0) {
    console.warn('No pixels were modified by flood fill');
    return [];
  }

  // Call the visualization function
  visualizeModifiedPixels(width, height, floodFill);

  // Build binary mask
  const mask = new Uint8Array(width * height);
  for (const key of floodFill.modifiedPixels) {
    const [x, y] = key.split("|").map(Number);
    if (x >= 0 && x < width && y >= 0 && y < height) {
      mask[y * width + x] = 1;
    }
  }

  // Build a zero‑padded grid
  const grid = Array.from({ length: height + 2 }, (_, y) =>
    Array.from({ length: width + 2 }, (_, x) => {
      if (y === 0 || y === height + 1 || x === 0 || x === width + 1) return 0;
      return mask[(y - 1) * width + (x - 1)];
    })
  );

  const contours = isoContours(grid, [0.6]);
  console.log('Contours:', contours);
  if (!contours.length) return [];

  const ringsSimplified = contours.flat().map(ring => {
    const points = ring.map(([x, y]) => ({ x: x | 0, y: y | 0 }));
    return simplify(points, simplifyTol); // highQuality=true
  });

  const rings = ringsSimplified
  .filter(ring => ring.length >= 3)
  .sort((a, b) => polygonArea(b) - polygonArea(a));

  console.log("RingsInt: ", rings)

  // Put in is outer / inner ring algo//
  let items = [];
  rings.map((points, index) => {
    let fog = buildCurve()
    .points(
      points
    )
    .tension(0)
    .layer("FOG")
    .scale({x: 3, y: 3})
    .visible(isOuterRing(points)) // outer rings cut (invisible), inner rings stay solid
    .build();
    items.push(fog);
  });

  items.sort((a, b) => {
    // Sort so that visible items come first
    return (b.visible === true) - (a.visible === true);
  });

  return items;
}

function calculateSignedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length]; // Wrap around to the first point
    area += (p1.x * p2.y - p2.x * p1.y);
  }
  return area / 2; // Divide by 2 to get the signed area
}

function isOuterRing(points) {
  const signedArea = calculateSignedArea(points);
  return signedArea > 0; // Positive area indicates outer ring
}



// Create a visual representation of modified pixels
function visualizeModifiedPixels(width, height, floodFill) {
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

function polygonArea(points) {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const { x: x1, y: y1 } = points[i];
    const { x: x2, y: y2 } = points[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}