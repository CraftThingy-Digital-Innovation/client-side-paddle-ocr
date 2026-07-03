# Client-Side PaddleOCR Compiler & Bundler

[Bahasa Indonesia](#bahasa-indonesia) | [English](#english)

---

## Bahasa Indonesia

Proyek ini berfungsi sebagai **Vite-based compiler / bundler** yang mengubah library Node.js server-side `ppu-paddle-ocr` menjadi modul JavaScript siap pakai di sisi client (web browser).

Pustaka biner bawaan `ppu-paddle-ocr` memiliki ketergantungan native C++ (seperti OpenCV Node dan ONNX Runtime Node) yang tidak didukung oleh browser. Proyek ini memotong dan mengganti ketergantungan tersebut menggunakan teknik **Shimming** dan **Compile-Time Aliasing**.

### 1. Cara Kerja & Shimming Engine

Modul dikompilasi menggunakan bundler **Vite** dalam *Library Mode* dengan konfigurasi alias khusus pada `vite.config.js`. Berikut adalah detail shim yang disematkan:

1.  **Canvas Shim (`browser-canvas-shim.js`)**:
    Menangkap impor `@napi-rs/canvas` (pustaka biner canvas Node) dan mengalihkan seluruh pemanggilan method-method gambarnya ke objek global browser asli (`HTMLCanvasElement`, `document.createElement('canvas')`, dan `new Image()`). Ini memungkinkan pembuatan canvas secara dinamis di dalam browser.
2.  **Filesystem Shim (`browser-fs-shim.js`)**:
    Mengganti pemanggilan sinkron Node `fs.readFileSync` dengan XHR sinkron (`XMLHttpRequest`) yang dikonfigurasikan dengan `overrideMimeType('text/plain; charset=x-user-defined')`. Teknik ini memaksa browser mengunduh biner model ONNX sebagai aliran byte raw tanpa merusak struktur filenya, menghindari kesalahan parser browser.
3.  **URL-Aware Path Shim (`browser-path-shim.js`)**:
    Menggantikan parser POSIX `path-browserify` dengan wrapper kustom. Ketika mendeteksi URL absolute (`http://` atau `https://`), modul ini langsung mengembalikan nilainya secara utuh tanpa merusak karakter double-slash (`//`) menjadi single-slash.
4.  **WASM Sequential Engine (`main.js`)**:
    Menyusun inisialisasi AI secara asinkron (`ort.InferenceSession.create(url)`).
    **Crucial Browser Optimization**: Meng-override method `processBoxesInParallel` milik `RecognitionService` agar berjalan secara **Sekuensial** (satu-demi-satu) dan menambahkan jeda mikro `setTimeout(resolve, 10)` sebelum memproses tiap kotak gambar. Ini mencegah runtime WebAssembly (WASM) membekukan / me-lock main thread GUI browser Anda saat memproses puluhan kotak deteksi sekaligus.

### 2. Cara Menginstal & Membangun Bundle

#### Langkah A: Persiapan Awal
Pastikan Anda memiliki Node.js terinstal pada sistem Anda. Masuk ke folder proyek bundler:
```bash
cd D:\CraftThingy\client-side-paddle-ocr-project
```

#### Langkah B: Instal Dependencies
Unduh Vite beserta pustaka `ppu-paddle-ocr` asli dari npm registry:
```bash
npm install
```

#### Langkah C: Bangun Modul (Compilation)
Kompilasikan kode sumber beserta seluruh shimming-nya menjadi satu berkas JavaScript tunggal:
```bash
npm run build
```

Hasil kompilasi akan ditaruh di folder `dist/` dalam format:
*   `dist/paddle-ocr-client.umd.js`: Format UMD yang siap diimpor via `<script src="...">` di HTML/PHP biasa.
*   `dist/paddle-ocr-client.es.js`: Format ES Modules untuk proyek modern (Vite, Webpack, React, Vue, dll.).

### 3. Struktur Berkas Proyek
*   `main.js`: Titik masuk utama (Entrypoint) yang membungkus `PaddleOcrService` menjadi kelas global browser `PaddleOCRClient` dan menyematkan patch sekuensial.
*   `vite.config.js`: Berisi pemetaan alias bundler dan konfigurasi library output.
*   `browser-canvas-shim.js`: Menjembatani fungsi canvas server ke HTML5 Canvas client.
*   `browser-fs-shim.js`: Menjembatani fungsi `fs` ke XMLHttpRequest browser.
*   `browser-path-shim.js`: Menjembatani fungsi manipulasi direktori ke string URL web.
*   `browser-url-shim.js`: Menjembatani fungsi pemetaan berkas URL Node.

### 4. API Reference

#### **`class PaddleOCRClient`**
Pustaka pembungkus (wrapper) utama untuk menjalankan deteksi & rekognisi teks PaddleOCR di dalam browser.

##### **`constructor(options)`**
*   `options.verbose` (boolean): Menampilkan log debugger di konsol browser (default: `false`).
*   `options.maxSideLength` (number): Skala sisi gambar maksimum untuk detektor OCR. Nilai yang lebih tinggi (seperti `2000`) meningkatkan akurasi deteksi simbol/teks kecil, namun memakan lebih banyak memori (default: `2000`).

##### **`async init(modelConfig)`**
Mengunduh model ONNX dan file dictionary kamus secara asinkron lewat HTTP dan memuatnya ke runtime WebAssembly.
*   `modelConfig.detection` (string): URL path file model deteksi ONNX (default: `'/models/en_PP-OCRv3_det_infer.onnx'`).
*   `modelConfig.recognition` (string): URL path file model rekognisi ONNX (default: `'/models/en_PP-OCRv3_rec_infer.onnx'`).
*   `modelConfig.charactersDictionary` (string): URL path file kamus karakter (default: `'/models/en_dict.txt'`).

##### **`async recognize(imageInput)`**
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

### 5. Contoh Penggunaan (Code Examples)

#### Contoh A: Memindai Gambar dari Tag `<img>`
```html
<script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.min.js"></script>
<script async src="https://docs.opencv.org/4.5.4/opencv.js"></script>
<script>
  window.cv = window.Module = {
    onRuntimeInitialized: () => window.isOpencvReady = true
  };
  window.process = { env: { NODE_ENV: 'production' }, cwd: () => '/' };
  window.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
</script>
<script src="/js/paddle-ocr-client.js"></script>

<script>
  async function runOCR() {
    const ocr = new PaddleOCRClient({ verbose: true });
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

#### Contoh B: Memindai Halaman PDF (Menggunakan PDF.js)
```javascript
async function scanPdfPage(pdfUrl, pageNum) {
  const loadingTask = pdfjsLib.getDocument(pdfUrl);
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNum);
  
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext('2d');
  
  await page.render({ canvasContext: context, viewport: viewport }).promise;

  const ocr = new PaddleOCRClient();
  await ocr.init();
  
  const result = await ocr.recognize(canvas);
  console.log(`Teks Halaman ${pageNum}:`, result.text);
}
```

---

## English

This project serves as a **Vite-based compiler / bundler** that transforms the server-side Node.js `ppu-paddle-ocr` library into a client-side JavaScript module ready for web browsers.

Since `ppu-paddle-ocr` relies on native C++ bindings (such as node-opencv and node-onnxruntime), it cannot run directly in browsers. This project replaces those dependencies using **Shimming** and **Compile-Time Aliasing**.

### 1. Architecture & Shimming Engine

The compiler bundles modules using **Vite** in *Library Mode* with custom aliases defined in `vite.config.js`. Below are the detailed shims applied:

1.  **Canvas Shim (`browser-canvas-shim.js`)**:
    Reroutes `@napi-rs/canvas` methods (a native canvas library for Node) to browser-native canvas elements (`HTMLCanvasElement`, `document.createElement('canvas')`, and `new Image()`). This allows canvas elements to be created dynamically in the browser.
2.  **Filesystem Shim (`browser-fs-shim.js`)**:
    Replaces Node's synchronous `fs.readFileSync` with a synchronous `XMLHttpRequest` configured with `overrideMimeType('text/plain; charset=x-user-defined')` to download raw binary ONNX models without corruption, bypassing browser parser errors.
3.  **URL-Aware Path Shim (`browser-path-shim.js`)**:
    Patches POSIX path helpers to handle absolute URL paths (`http://` or `https://`) and prevent double-slash (`//`) paths from being converted into single slashes.
4.  **WASM Sequential Engine (`main.js`)**:
    Sets up asynchronous AI initialization (`ort.InferenceSession.create(url)`).
    **Crucial Browser Optimization**: Overrides `processBoxesInParallel` inside `RecognitionService` to process bounding boxes **sequentially** instead of concurrently, yielding with `setTimeout(resolve, 10)` before each run. This prevents concurrent WebAssembly inferences from locking up the browser's main GUI thread.

### 2. How to Install & Build

#### Step A: Preparation
Ensure you have Node.js installed. Navigate to the bundler directory:
```bash
cd D:\CraftThingy\client-side-paddle-ocr-project
```

#### Step B: Install Dependencies
Download Vite and the original `ppu-paddle-ocr` package:
```bash
npm install
```

#### Step C: Build the Bundle (Compilation)
Compile the source code and shims into a single JavaScript library file:
```bash
npm run build
```

The compiled output is created under the `dist/` directory:
*   `dist/paddle-ocr-client.umd.js` (Universal Module Definition for script tags in legacy browsers or vanilla HTML/PHP).
*   `dist/paddle-ocr-client.es.js` (ES Modules for modern bundlers like Vite or Webpack).

### 3. Project Directory Structure
*   `main.js`: The primary entry point. Wraps `PaddleOcrService` into a global browser class `PaddleOCRClient` and hooks the sequential run patch.
*   `vite.config.js`: Defines the bundler alias mappings and library output config.
*   `browser-canvas-shim.js`: Redirects canvas operations to HTML5 Canvas.
*   `browser-fs-shim.js`: Routes Node `fs` calls to XMLHttpRequest.
*   `browser-path-shim.js`: Routes directory manipulation to standard web URLs.
*   `browser-url-shim.js`: Emulates URL mapping.

### 4. API Reference

#### **`class PaddleOCRClient`**
The primary library wrapper class to initialize and run PaddleOCR client-side inside the browser.

##### **`constructor(options)`**
*   `options.verbose` (boolean): Prints debug statements to browser developer tools console (default: `false`).
*   `options.maxSideLength` (number): Scaled limit of the maximum side length for the text detector. Larger values (e.g. `2000`) increase accuracy for small/blurry characters but consume more memory (default: `2000`).

##### **`async init(modelConfig)`**
Asynchronously downloads ONNX model binaries and character files over HTTP and compiles them into WebAssembly.
*   `modelConfig.detection` (string): URL path to the detection ONNX model file (default: `'/models/en_PP-OCRv3_det_infer.onnx'`).
*   `modelConfig.recognition` (string): URL path to the recognition ONNX model file (default: `'/models/en_PP-OCRv3_rec_infer.onnx'`).
*   `modelConfig.charactersDictionary` (string): URL path to the character dictionary text file (default: `'/models/en_dict.txt'`).

##### **`async recognize(imageInput)`**
Extracts text boundaries and text lines from a given graphical element.
*   `imageInput` (HTMLImageElement | HTMLCanvasElement | Blob | File | ArrayBuffer): The source image/canvas or file binary to scan.
*   **Return Value**: Returns a `Promise` resolving to:
    ```json
    {
      "text": "The compiled string of all recognized text lines...",
      "lines": [
        {
          "text": "Specific line string content",
          "box": { "x": 10, "y": 15, "width": 120, "height": 30 },
          "words": [
            { "text": "Specific", "box": { "x": 10, "y": 15, "width": 40, "height": 30 } },
            { "text": "line", "box": { "x": 55, "y": 15, "width": 35, "height": 30 } }
          ]
        }
      ]
    }
    ```

### 5. Code Examples

#### Example A: Scanning an Image element (`<img>`)
```html
<script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.min.js"></script>
<script async src="https://docs.opencv.org/4.5.4/opencv.js"></script>
<script>
  window.cv = window.Module = {
    onRuntimeInitialized: () => window.isOpencvReady = true
  };
  window.process = { env: { NODE_ENV: 'production' }, cwd: () => '/' };
  window.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
</script>
<script src="/js/paddle-ocr-client.js"></script>

<script>
  async function runOCR() {
    const ocr = new PaddleOCRClient({ verbose: true });
    await ocr.init({
      detection: '/models/en_PP-OCRv3_det_infer.onnx',
      recognition: '/models/en_PP-OCRv3_rec_infer.onnx',
      charactersDictionary: '/models/en_dict.txt'
    });

    const img = document.getElementById('my-image');
    const result = await ocr.recognize(img);
    console.log("Scanned Text Output:", result.text);
  }
</script>
```

#### Example B: Scanning a PDF page (with PDF.js)
```javascript
async function scanPdfPage(pdfUrl, pageNum) {
  const loadingTask = pdfjsLib.getDocument(pdfUrl);
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNum);
  
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext('2d');
  
  await page.render({ canvasContext: context, viewport: viewport }).promise;

  const ocr = new PaddleOCRClient();
  await ocr.init();
  
  const result = await ocr.recognize(canvas);
  console.log(`Page ${pageNum} parsed text:`, result.text);
}
```
