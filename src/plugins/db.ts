import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import {
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library.js';
import { HttpCompatibleError } from './handle-http-error.js';
import { HttpErrorCodes } from '@fastify/sensible/lib/httpError.js';
import { Static } from '@sinclair/typebox';
import { prismaStatsSchema } from '../routes/stats/schemas.js';

export default fp(async (fastify) => {
  const prisma = new PrismaClient({
    log: ['warn', 'error'],
  }).$extends({
    query: {
      $allOperations: ({ model = '', operation, args, query }) => {
        fastify.prismaStats.operationHistory.push({
          model,
          operation,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          args,
        });
        return query(args).catch(handlePrismaError);
      },
    },
  }) as unknown as PrismaClient;

  fastify.decorate('prismaStats', {
    operationHistory: [],
  });
  fastify.decorate('prisma', prisma);
});

function handlePrismaError(error: unknown) {
  const info: { code: HttpErrorCodes; mes: string } = {
    code: 502,
    mes: 'Unexpected database error.',
  };

  if (error instanceof PrismaClientKnownRequestError) {
    info.mes = error.message;
    info.code = 422;
  }
  if (error instanceof PrismaClientValidationError) {
    info.mes = error.message;
    info.code = 400;
  }
  if (
    error instanceof PrismaClientUnknownRequestError ||
    error instanceof PrismaClientRustPanicError
  ) {
    info.mes = error.message;
    info.code = 502;
  }

  throw new HttpCompatibleError(info.code, info.mes);
}

declare module 'fastify' {
  export interface FastifyInstance {
    prisma: PrismaClient;
    prismaStats: Static<typeof prismaStatsSchema>;
  }
}
