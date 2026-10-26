import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  // Vite does not serve Vercel functions, so mount the same handler for local preview.
  for (const key of ['LARK_APP_ID', 'LARK_APP_SECRET', 'LARK_BASE_TOKEN', 'LARK_WIKI_NODE_TOKEN', 'LARK_BRANCHES_TABLE_ID', 'LARK_ROOMS_TABLE_ID', 'LARK_SETTINGS_TABLE_ID']) {
    if (env[key]) process.env[key] = env[key];
  }
  return {
    plugins: [react(), tailwindcss(), {
      name: 'local-lark-api',
      configureServer(server) {
        server.middlewares.use('/api/properties', async (req, res) => {
          const apiResponse = res as typeof res & { status: (code: number) => typeof res; json: (data: unknown) => typeof res };
          apiResponse.status = (code: number) => { res.statusCode = code; return res; };
          apiResponse.json = (data: unknown) => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(data));
            return res;
          };
          try {
            const { default: handler } = await import('./api/properties.js');
            await handler(req, res);
          } catch (error) {
            console.error('Local property API failed:', error);
            if (!res.headersSent) res.statusCode = 500;
            if (!res.writableEnded) res.end(JSON.stringify({ error: 'Local property API failed' }));
          }
        });
      },
    }],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
