export const Canvas = typeof HTMLCanvasElement !== 'undefined' ? HTMLCanvasElement : class {};
export const ImageData = typeof globalThis.ImageData !== 'undefined' ? globalThis.ImageData : class {};

/**
 * Browser-native canvas creator
 */
export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Loads images from multiple sources (DOM Elements, URLs, base64 strings, Blobs, Files, and ArrayBuffers)
 * and returns an HTMLImageElement or HTMLCanvasElement inside a Promise.
 */
export function loadImage(source) {
  if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
    if (source.complete) return Promise.resolve(source);
    return new Promise((resolve, reject) => {
      source.onload = () => resolve(source);
      source.onerror = (err) => reject(new Error('Failed to load image element: ' + err.message));
    });
  }
  if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
    return Promise.resolve(source);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Clean up object URLs to prevent memory leaks
      if (typeof source === 'object' && img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
      resolve(img);
    };
    img.onerror = (err) => reject(new Error('Failed to load image source: ' + err.message));
    
    if (source instanceof Blob || source instanceof File) {
      img.src = URL.createObjectURL(source);
    } else if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
      const blob = new Blob([source]);
      img.src = URL.createObjectURL(blob);
    } else {
      img.src = source;
    }
  });
}
