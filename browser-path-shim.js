/**
 * Custom URL-aware path module shim.
 * Preserves HTTP/HTTPS protocol prefixes and avoids corrupting URLs during resolve and join operations.
 */

export function resolve(...args) {
  // If the last argument is a URL, return it directly to prevent path corruption
  const lastArg = args[args.length - 1];
  if (typeof lastArg === 'string' && (lastArg.startsWith('http://') || lastArg.startsWith('https://') || lastArg.startsWith('/'))) {
    return lastArg;
  }
  return lastArg;
}

export function join(...args) {
  // If any argument is a URL, combine them with simple slashes without removing double slashes
  if (args.some(arg => typeof arg === 'string' && (arg.startsWith('http://') || arg.startsWith('https://')))) {
    return args.join('/');
  }
  return args.join('/').replace(/\/+/g, '/');
}

export function dirname(p) {
  if (typeof p === 'string' && (p.startsWith('http://') || p.startsWith('https://'))) {
    try {
      const url = new URL(p);
      const pathname = url.pathname;
      const dir = pathname.substring(0, pathname.lastIndexOf('/'));
      return url.origin + (dir || '/');
    } catch (e) {
      return p.substring(0, p.lastIndexOf('/')) || '.';
    }
  }
  return p.substring(0, p.lastIndexOf('/')) || '.';
}

export default { resolve, join, dirname };
