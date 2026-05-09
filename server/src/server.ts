import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './router.js';
import path from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { getMimeType } from 'hono/utils/mime';

const app = new Hono();

function getClientDistDir() {
  // Running from `server/` (both dev and `node dist/server.js`), the client build is at `../client/dist`
  return process.env.CLIENT_DIST_DIR
    ? path.resolve(process.env.CLIENT_DIST_DIR)
    : path.resolve(process.cwd(), '../client/dist');
}

async function tryServeDistFile(requestPath: string) {
  const distDir = getClientDistDir();
  const resolvedPath = path.resolve(distDir, `.${requestPath}`);

  // Prevent path traversal (and other weird resolution) from escaping distDir
  if (!resolvedPath.startsWith(`${distDir}${path.sep}`) && resolvedPath !== distDir) {
    return null;
  }

  try {
    const file = await readFile(resolvedPath);
    const contentType = getMimeType(resolvedPath) ?? 'application/octet-stream';
    return { file, contentType };
  } catch {
    return null;
  }
}

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', message: 'Server is running' });
});

// TRPC API handler
app.all('/api/trpc/*', (c) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: () => ({}),
  });
});

// Serve built frontend (if present).
// - Serve real files (assets, favicon, etc) when the request path has an extension.
// - For SPA routes (no extension), fall back to `index.html`.
app.use('*', async (c, next) => {
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') return next();
  if (c.req.path.startsWith('/api')) return next();

  const distDir = getClientDistDir();
  if (!existsSync(distDir)) return next();

  const maybeFileName = path.posix.basename(c.req.path);
  const hasExtension = maybeFileName.includes('.');
  if (!hasExtension) return next();

  const result = await tryServeDistFile(c.req.path);
  if (!result) return next();

  return new Response(result.file, {
    headers: {
      'content-type': result.contentType,
      // Conservative caching: Vite fingerprints assets; everything else can be revalidated.
      'cache-control': c.req.path.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=0, must-revalidate',
    },
  });
});

app.get('*', async (c) => {
  if (c.req.path.startsWith('/api')) return c.notFound();

  const distDir = getClientDistDir();
  if (!existsSync(distDir)) {
    return c.json({
      message: 'TRPC Todo Server',
      note: 'Frontend dist not found; run client build and start the server to serve it.',
      endpoints: {
        health: '/health',
        api: '/api/trpc',
      },
    });
  }

  const indexResult = await tryServeDistFile('/index.html');
  if (!indexResult) return c.notFound();

  return new Response(indexResult.file, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
});

const port = parseInt(process.env.PORT || '3001');

console.log(`🚀 Server starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ Server running on http://localhost:${info.port}`);
  console.log(`📡 TRPC endpoint: http://localhost:${info.port}/api/trpc`);
  console.log(`🔍 Health check: http://localhost:${info.port}/health`);
});
