/**
 * Browser-side synchronous file-reading and filesystem shim.
 * Simulates Node's 'fs' module to allow compiling code written for Node.js in the browser.
 */

export function readFileSync(filePath, options) {
  const isText = (typeof options === 'string' && options.toLowerCase().includes('utf-8')) || 
                 (typeof options === 'object' && options.encoding && options.encoding.toLowerCase().includes('utf-8'));
  
  const xhr = new XMLHttpRequest();
  xhr.open('GET', filePath, false); // Synchronous GET request
  
  if (isText) {
    xhr.send();
    if (xhr.status !== 200 && xhr.status !== 0) {
      throw new Error(`Failed to read text file at ${filePath}: HTTP ${xhr.status}`);
    }
    return xhr.responseText;
  } else {
    // Synchronous binary reading in browser:
    // We cannot set responseType = 'arraybuffer' on synchronous requests.
    // Instead, override MIME type to 'x-user-defined' to read raw bytes.
    xhr.overrideMimeType('text/plain; charset=x-user-defined');
    xhr.send();
    
    if (xhr.status !== 200 && xhr.status !== 0) {
      throw new Error(`Failed to read binary file at ${filePath}: HTTP ${xhr.status}`);
    }
    
    // Convert binary string to ArrayBuffer
    const binaryString = xhr.responseText;
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i) & 0xff;
    }
    
    return {
      buffer: bytes.buffer,
      byteLength: bytes.byteLength
    };
  }
}

export function existsSync() {
  return false;
}

export function mkdirSync() {
  // No-op in browser
}

export function readdirSync() {
  return [];
}

export function unlinkSync() {
  // No-op in browser
}

export function createWriteStream() {
  return {
    write(chunk, cb) {
      if (typeof cb === 'function') cb();
      return true;
    },
    end() {},
    on() {}
  };
}

export default {
  readFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  createWriteStream
};
