# PaddleOCR Client-Side Browser Bundler Project

Proyek ini berfungsi sebagai **Vite-based compiler / bundler** yang mengubah library Node.js server-side `ppu-paddle-ocr` menjadi modul JavaScript siap pakai di sisi client (web browser).

Pustaka biner bawaan `ppu-paddle-ocr` memiliki ketergantungan native C++ (seperti OpenCV Node dan ONNX Runtime Node) yang tidak didukung oleh browser. Proyek ini memotong dan mengganti ketergantungan tersebut menggunakan teknik **Shimming** dan **Compile-Time Aliasing**.

---

## 1. Cara Kerja & Shimming Engine

Modul dikompilasi menggunakan bundler **Vite** dalam *Library Mode* dengan konfigurasi alias khusus pada `vite.config.js`:

1.  **Canvas Shim (`browser-canvas-shim.js`)**:
    Menangkap impor `@napi-rs/canvas` (pustaka biner canvas Node) dan mengalihkan seluruh pemanggilan method-method gambarnya ke objek global browser asli (`HTMLCanvasElement`, `document.createElement('canvas')`, dan `new Image()`).
2.  **Filesystem Shim (`browser-fs-shim.js`)**:
    Mengganti pemanggilan sinkron Node `fs.readFileSync` dengan XHR sinkron (`XMLHttpRequest`) yang dikonfigurasikan dengan `overrideMimeType('text/plain; charset=x-user-defined')`. Teknik ini memaksa browser mengunduh biner model ONNX sebagai aliran byte raw tanpa merusak struktur filenya.
3.  **URL-Aware Path Shim (`browser-path-shim.js`)**:
    Menggantikan parser POSIX `path-browserify` dengan wrapper kustom. Ketika mendeteksi URL absolute (`http://` atau `https://`), modul ini langsung mengembalikan nilainya secara utuh tanpa merusak karakter double-slash (`//`).
4.  **WASM Sequential Engine (`main.js`)**:
    Menyusun inisialisasi AI secara asinkron (`ort.InferenceSession.create(url)`).
    **Crucial Browser Optimization**: Meng-override method `processBoxesInParallel` milik `RecognitionService` agar berjalan secara **Sekuensial** (satu-demi-satu) dan menambahkan jeda mikro `setTimeout(resolve, 10)` sebelum memproses tiap kotak gambar. Ini mencegah runtime WebAssembly (WASM) membekukan / me-lock main thread GUI browser Anda saat memproses puluhan kotak deteksi sekaligus.

---

## 2. Cara Menginstal & Membangun Bundle

### Langkah 1: Persiapan Awal
Pastikan Anda memiliki Node.js terinstal pada sistem Anda. Masuk ke folder proyek bundler:
```bash
cd D:\CraftThingy\client-side-paddle-ocr-project
```

### Langkah 2: Instal Dependencies
Unduh Vite beserta pustaka `ppu-paddle-ocr` asli dari npm registry:
```bash
npm install
```

### Langkah 3: Bangun Modul (Compilation)
Kompilasikan kode sumber beserta seluruh shimming-nya menjadi satu berkas JavaScript tunggal:
```bash
npm run build
```

Hasil kompilasi akan ditaruh di folder `dist/` dalam format:
*   `dist/paddle-ocr-client.umd.js`: Format UMD yang siap diimpor via `<script src="...">` di HTML/PHP biasa.
*   `dist/paddle-ocr-client.es.js`: Format ES Modules untuk proyek modern (Vite, Webpack, React, Vue, dll.).

---

## 3. API Reference

### **`class PaddleOCRClient`**
Pustaka pembungkus (wrapper) utama untuk menjalankan deteksi & rekognisi teks PaddleOCR di dalam browser.

#### **`constructor(options)`**
*   `options.verbose` (boolean): Menampilkan log debugger di konsol browser (default: `false`).
*   `options.maxSideLength` (number): Skala sisi gambar maksimum untuk detektor OCR. Nilai yang lebih tinggi (seperti `2000`) meningkatkan akurasi deteksi simbol/teks kecil, namun memakan lebih banyak memori (default: `2000`).

#### **`async init(modelConfig)`**
Mengunduh model ONNX dan file dictionary kamus secara asinkron lewat HTTP dan memuatnya ke runtime WebAssembly.
*   `modelConfig.detection` (string): URL path file model deteksi ONNX (default: `'/models/en_PP-OCRv3_det_infer.onnx'`).
*   `modelConfig.recognition` (string): URL path file model rekognisi ONNX (default: `'/models/en_PP-OCRv3_rec_infer.onnx'`).
*   `modelConfig.charactersDictionary` (string): URL path file kamus karakter (default: `'/models/en_dict.txt'`).

#### **`async recognize(imageInput)`**
Mengekstrak teks dan koordinat layout geometris dari input gambar/canvas.
*   `imageInput` (HTMLImageElement | HTMLCanvasElement | Blob | File | ArrayBuffer): Elemen gambar DOM, elemen canvas, blob file, file lokal, atau buffer biner gambar yang akan dipindai.
*   **Return Value**: Mengembalikan `Promise` yang menghasilkan objek:
    ```json
    {
      "text": "Teks lengkap dokumen hasil gabungan...",
      "lines": [
        {
          "text": "Baris teks tertentu",
          "box": { "x": 10, "y": 15, "width": 120, "height": 30 },
          "words": [
            { "text": "Baris", "box": { "x": 10, "y": 15, "width": 40, "height": 30 } },
            { "text": "teks", "box": { "x": 55, "y": 15, "width": 35, "height": 30 } }
          ]
        }
      ]
    }
    ```

---

## 4. Contoh Penggunaan (Code Examples)

### Contoh A: Memindai Gambar dari Tag `<img>`
```html
<script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.min.js"></script>
<script async src="https://docs.opencv.org/4.5.4/opencv.js"></script>
<script>
  // Link OpenCV ke window.Module
  window.cv = window.Module = {
    onRuntimeInitialized: () => window.isOpencvReady = true
  };
  // Shims lingkungan Node.js
  window.process = { env: { NODE_ENV: 'production' }, cwd: () => '/' };
  window.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
</script>
<script src="/js/paddle-ocr-client.js"></script>

<script>
  async function runOCR() {
    // Inisialisasi client
    const ocr = new PaddleOCRClient({ verbose: true });
    
    // Muat model AI
    await ocr.init({
      detection: '/models/en_PP-OCRv3_det_infer.onnx',
      recognition: '/models/en_PP-OCRv3_rec_infer.onnx',
      charactersDictionary: '/models/en_dict.txt'
    });

    const img = document.getElementById('my-image');
    const result = await ocr.recognize(img);
    
    console.log("Hasil pemindaian:", result.text);
  }
</script>
```

### Contoh B: Memindai Halaman PDF (Menggunakan PDF.js)
```javascript
async function scanPdfPage(pdfUrl, pageNum) {
  // 1. Render halaman PDF ke Canvas menggunakan PDF.js
  const loadingTask = pdfjsLib.getDocument(pdfUrl);
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNum);
  
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext('2d');
  
  await page.render({ canvasContext: context, viewport: viewport }).promise;

  // 2. Jalankan PaddleOCR langsung menggunakan Canvas HTML5 tersebut
  const ocr = new PaddleOCRClient();
  await ocr.init(); // Menggunakan path model default
  
  const result = await ocr.recognize(canvas);
  console.log(`Teks Halaman ${pageNum}:`, result.text);
}
```
