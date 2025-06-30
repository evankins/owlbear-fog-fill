export function loadImage(urlOrFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
  
      img.onload  = () => resolve(img);
      img.onerror = reject;
  
      img.src =
        urlOrFile instanceof Blob
          ? URL.createObjectURL(urlOrFile)
          : urlOrFile;
    });
  }
  