import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './router.js';

const app = new Hono();

// Enable CORS for the client
app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server and potential client ports
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

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

// Root endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'TRPC Todo Server', 
    endpoints: {
      health: '/health',
      api: '/api/trpc',
    }
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
