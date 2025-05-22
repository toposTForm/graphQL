import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import { getUserByIdSchema, userSchema } from '../../schemas.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  fastify.route({
    url: '/',
    method: 'GET',
    schema: {
      ...getUserByIdSchema,
      response: {
        200: Type.Array(userSchema),
      },
    },
    async handler(req) {
      return prisma.user.findMany({
        where: {
          userSubscribedTo: {
            some: {
              authorId: req.params.userId,
            },
          },
        },
      });
    },
  });
};

export default plugin;
