import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FastifyInstance } from 'fastify';
import tap from 'tap';
// @ts-ignore
import helper from 'fastify-cli/helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type Test = (typeof tap)['Test']['prototype'];

const AppPath = join(__dirname, '..', 'dist', 'app.js');

function config() {
  return {};
}

async function build(t: Test) {
  const argv = [AppPath];
  const app = (await helper.build(argv, config())) as FastifyInstance;
  t.teardown(() => app.close());
  return app;
}

export { config, build };
