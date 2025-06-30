import { loadImage } from './loadImage'; 

export async function imageToImageData(urlOrFile) {
    const img = await loadImage(urlOrFile);
  
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
  
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }