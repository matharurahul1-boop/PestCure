import type { NextFunction, Request, Response } from 'express';
import { createApi, loadEnvFiles, optionsFromEnv } from './app';

type Api = ReturnType<typeof createApi>;
const KEY = '__pestcureLocalApi';

/** One API (and one open database) per dev-server process, even if Vite reloads this module. */
function api(): Api {
  const g = globalThis as unknown as Record<string, Api | undefined>;
  if (!g[KEY]) { loadEnvFiles(); g[KEY] = createApi(optionsFromEnv()); }
  return g[KEY]!;
}

/** Connect-style handler Vite mounts under /api, so `npm run dev` serves the app and its backend on one port. */
export function apiMiddleware() {
  const { app, ready } = api();
  return (req: Request, res: Response, next: NextFunction) => {
    ready.then(() => app(req, res, next), next);
  };
}
