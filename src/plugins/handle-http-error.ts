import fp from 'fastify-plugin';
import { HttpErrorCodes } from '@fastify/sensible/lib/httpError.js';
import { sensiblePluginTag } from './sensible.js';

export class HttpCompatibleError extends Error {
  constructor(
    public httpCode: HttpErrorCodes,
    public message: string,
  ) {
    super();
  }
}

export default fp(
  async (fastify) => {
    fastify.setErrorHandler((error) => {
      if (error instanceof HttpCompatibleError) {
        return fastify.httpErrors.getHttpError(error.httpCode, error.message);
      }
      return error;
    });
  },
  {
    dependencies: [sensiblePluginTag],
  },
);
