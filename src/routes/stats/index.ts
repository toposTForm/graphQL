import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { prismaStatsSchema } from './schemas.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.route({
    url: '/prisma',
    method: 'GET',
    schema: {
      response: {
        200: prismaStatsSchema,
      },
    },
    async handler() {
      return fastify.prismaStats;
    },
  });
};

export default plugin;
