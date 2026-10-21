import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createApi, loadEnvFiles, optionsFromEnv } from './app';

/** Standalone server: serves the built app (dist/) and the /api backend on one origin. Run `npm run build` first. */
loadEnvFiles();
const api = createApi(optionsFromEnv());
await api.ready;

const root = express();
root.disable('x-powered-by');
root.use('/api', api.app);

const dist = path.resolve(process.cwd(), 'dist');
if (existsSync(dist)) {
  root.use(express.static(dist, { index: false, maxAge: '1h' }));
  root.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  console.warn('[pestcure] No dist/ folder found — run "npm run build" to serve the app from this server, or use "npm run dev".');
}

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '127.0.0.1';
root.listen(port, host, () => console.log(`[pestcure] http://${host}:${port}  (SQLite: ${optionsFromEnv().dbPath})`));
