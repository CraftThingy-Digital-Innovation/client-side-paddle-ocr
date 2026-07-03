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
    **Crucial Browser Optimization**: Meng-override method `processBoxesInParallel` milik `RecognitionService` agar berjalan secara **Sekuensial** (satu-demi-satu) dan menambahkan jeda jeda mikro `setTimeout(resolve, 10)` sebelum memproses tiap kotak gambar. Ini mencegah runtime WebAssembly (WASM) membekukan / me-lock main thread GUI browser Anda saat memproses puluhan kotak deteksi sekaligus.

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

## 3. Struktur Berkas Proyek

*   `main.js`: Titik masuk utama (Entrypoint) yang membungkus `PaddleOcrService` menjadi kelas global browser `PaddleOCRClient` dan menyematkan patch sekuensial.
*   `vite.config.js`: Berisi pemetaan alias bundler dan konfigurasi library output.
*   `browser-canvas-shim.js`: Menjembatani fungsi canvas server ke HTML5 Canvas client.
*   `browser-fs-shim.js`: Menjembatani fungsi `fs` ke XMLHttpRequest browser.
*   `browser-path-shim.js`: Menjembatani fungsi manipulasi direktori ke string URL web.
*   `browser-url-shim.js`: Menjembatani fungsi pemetaan berkas URL Node.
