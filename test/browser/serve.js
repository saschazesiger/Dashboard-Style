/**
 * Static server for the browser tests: the repository root on
 * http://127.0.0.1:4173 (or the port given, else DS_TEST_PORT), so fixtures
 * load /dist/... exactly as a project would and the styleguide runs at
 * /styleguide/index.html.
 *
 *   node test/browser/serve.js [port]
 *
 * Dependency-free (node:http). Correct MIME types (module fixtures need
 * text/javascript), nothing outside the root, no directory listings and no
 * caching headers, so every run sees the files as they are on disk.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = Number(process.argv[2] || process.env.DS_TEST_PORT || 4173);
const HOST = '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};

function send(response, status, body, type = 'text/plain; charset=utf-8') {
  response.writeHead(status, { 'Content-Type': type, 'Content-Length': Buffer.byteLength(body) });
  response.end(body);
}

/** The file a request path names, or null when it would leave the root. */
function resolvePath(url) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(url, `http://${HOST}`).pathname);
  } catch {
    return null;
  }
  if (pathname.includes('\0')) return null;
  const path = resolve(ROOT, `.${pathname}`);
  return path === ROOT || path.startsWith(ROOT + sep) ? path : null;
}

export function createStaticServer() {
  return createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') return send(response, 405, 'Method not allowed');
    const path = resolvePath(request.url);
    if (!path) return send(response, 403, 'Forbidden');
    try {
      // Directories get no listing and no index file: tests name the page.
      if (!(await stat(path)).isFile()) return send(response, 404, 'Not found');
      const body = await readFile(path);
      response.writeHead(200, {
        'Content-Type': TYPES[extname(path).toLowerCase()] || 'application/octet-stream',
        'Content-Length': body.length,
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch {
      send(response, 404, 'Not found');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createStaticServer().listen(PORT, HOST, () => {
    process.stdout.write(`Serving ${ROOT} on http://${HOST}:${PORT}/\n`);
  });
}
