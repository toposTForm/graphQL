import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import { postSchema } from '../../../posts/schemas.js';
import { getPostsByUserIdSchema } from './schemas.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  fastify.route({
    url: '/',
    method: 'GET',
    schema: {
      ...getPostsByUserIdSchema,
      response: {
        200: Type.Array(postSchema),
      },
    },
    async handler(req) {
      return prisma.post.findMany({
        where: {
          authorId: req.params.userId,
        },
      });
    },
  });
};

export default plugin;
