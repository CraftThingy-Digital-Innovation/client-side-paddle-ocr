import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      // Direct Node.js native Canvas library to our browser-canvas HTML5 shim
      '@napi-rs/canvas': path.resolve(__dirname, 'browser-canvas-shim.js'),
      // Redirect Node.js ONNX runtime to browser ONNX WASM runtime
      'onnxruntime-node': 'onnxruntime-web',
      // Mock Node's fs file reader with our browser XHR GET request shim
      'fs': path.resolve(__dirname, 'browser-fs-shim.js'),
      // Polyfill url module
      'url': path.resolve(__dirname, 'browser-url-shim.js'),
      // Polyfill path module for URL-aware resolving
      'path': path.resolve(__dirname, 'browser-path-shim.js')
    }
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'main.js'),
      name: 'PaddleOCRClient',
      fileName: (format) => `paddle-ocr-client.${format}.js`,
      formats: ['umd', 'es']
    },
    rollupOptions: {
      external: (id) => {
        return id.includes('@techstark/opencv-js') || 
               id.includes('onnxruntime-node') || 
               id.includes('onnxruntime-web');
      },
      output: {
        globals: {
          '@techstark/opencv-js': 'cv',
          'onnxruntime-node': 'ort',
          'onnxruntime-web': 'ort'
        }
      }
    },
    minify: 'esbuild',
    sourcemap: false
  }
});
