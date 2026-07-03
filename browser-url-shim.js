/**
 * Browser-side 'url' module shim.
 * Polyfills fileURLToPath which is used in Node.js environments to map file URLs to local paths.
 */
export function fileURLToPath(url) {
  // In the browser, we just pass the URL string as-is.
  return url;
}

export default { fileURLToPath };
