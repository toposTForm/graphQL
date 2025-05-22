import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import { FastifyPluginAsync } from 'fastify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const opts: Partial<AutoloadPluginOptions> = {
  ignoreFilter: (path: string) => {
    const isFileNested = (path.match(new RegExp('/', 'g')) ?? []).length > 1;
    if (!isFileNested) {
      return false;
    }
    return !path.endsWith('index.js');
  },
  forceESM: true,
};

const app: FastifyPluginAsync = async (fastify, _) => {
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    ...opts,
  });

  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    routeParams: true,
    ...opts,
  });
};

export default app;
