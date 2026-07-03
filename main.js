import { PaddleOcrService } from 'ppu-paddle-ocr';
import * as ort from 'onnxruntime-web';

class PaddleOCRClient {
  /**
   * Instantiate PaddleOCRClient
   * @param {object} options Configurations (e.g. { verbose: true, detection: { maxSideLength: 2000 } })
   */
  constructor(options = {}) {
    this.options = options;
    this.service = null;
  }

  /**
   * Initialize and load model assets via HTTP GET requests
   * @param {object} modelConfig Custom model paths, defaults to '/models/en_PP-OCRv3_det_infer.onnx', etc.
   */
  async init(modelConfig = {}) {
    const defaultModel = {
      detection: '/models/en_PP-OCRv3_det_infer.onnx',
      recognition: '/models/en_PP-OCRv3_rec_infer.onnx',
      charactersDictionary: '/models/en_dict.txt'
    };

    const finalModelConfig = {
      ...defaultModel,
      ...modelConfig
    };

    // Instantiate native service using our options and model endpoints
    this.service = new PaddleOcrService({
      model: finalModelConfig,
      detection: {
        maxSideLength: this.options.maxSideLength || 2000,
        ...this.options.detection
      },
      debugging: {
        verbose: this.options.verbose || false,
        debug: false
      }
    });

    console.log('Initializing Client-Side PaddleOCR Service...');
    
    // 1. Fetch character dictionary asynchronously (non-blocking)
    console.log('Fetching characters dictionary from: ' + finalModelConfig.charactersDictionary);
    const dictResponse = await fetch(finalModelConfig.charactersDictionary);
    if (!dictResponse.ok) {
      throw new Error(`Failed to fetch characters dictionary: ${dictResponse.status} ${dictResponse.statusText}`);
    }
    const dictText = await dictResponse.text();
    const charactersDictionary = dictText.split('\n');
    this.service.options.recognition.charactersDictionary = charactersDictionary;
    console.log(`Character dictionary loaded with ${charactersDictionary.length} entries.`);

    // 2. Load detection session asynchronously
    console.log('Loading detection model asynchronously from: ' + finalModelConfig.detection);
    // ONNX Runtime Web natively supports loading directly from URL asynchronously
    this.service.detectionSession = await ort.InferenceSession.create(finalModelConfig.detection);
    console.log('Detection ONNX model loaded successfully.');

    // 3. Load recognition session asynchronously
    console.log('Loading recognition model asynchronously from: ' + finalModelConfig.recognition);
    this.service.recognitionSession = await ort.InferenceSession.create(finalModelConfig.recognition);
    console.log('Recognition ONNX model loaded successfully.');
    
    console.log('Client-Side PaddleOCR Service initialized successfully.');
  }

  /**
   * Runs OCR text and layout extraction on an image canvas, URL, base64, Blob or File.
   * @param {string|HTMLCanvasElement|Blob|File|ArrayBuffer} imageInput
   * @returns {Promise<{text: string, lines: Array<{text: string, box: object, words: Array}>}>}
   */
  async recognize(imageInput) {
    if (!this.service) {
      throw new Error('PaddleOCRClient has not been initialized. Please call .init() first.');
    }

    const result = await this.service.recognize(imageInput);
    
    // Group segments and calculate line-level coordinates
    const lines = (result.lines || []).map(wordArray => {
      const lineText = wordArray.map(w => w.text).join(' ');
      const lineBox = this.getEncompassingBox(wordArray);
      return {
        text: lineText,
        box: lineBox,
        words: wordArray.map(w => ({
          text: w.text || '',
          box: w.box || { x: 0, y: 0, width: 0, height: 0 }
        }))
      };
    });

    return {
      text: result.text || '',
      lines
    };
  }

  /**
   * Helper to merge multiple bounding boxes into an encompassing bounding box.
   */
  getEncompassingBox(words) {
    if (!words || words.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const word of words) {
      const box = word.box;
      if (box) {
        minX = Math.min(minX, box.x);
        minY = Math.min(minY, box.y);
        maxX = Math.max(maxX, box.x + box.width);
        maxY = Math.max(maxY, box.y + box.height);
      }
    }

    return {
      x: minX === Infinity ? 0 : minX,
      y: minY === Infinity ? 0 : minY,
      width: maxX === -Infinity ? 0 : (maxX - minX),
      height: maxY === -Infinity ? 0 : (maxY - minY)
    };
  }
}

// Expose globally to window object for CDN-style usage
if (typeof window !== 'undefined') {
  window.PaddleOCRClient = PaddleOCRClient;
}

export { PaddleOCRClient };
export default PaddleOCRClient;
