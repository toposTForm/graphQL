import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import { subscribeToUserSchema, unsubscribeFromUserSchema } from './schemas.js';
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
          subscribedToUser: {
            some: {
              subscriberId: req.params.userId,
            },
          },
        },
      });
    },
  });

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...subscribeToUserSchema,
      response: {
        204: Type.Void(),
      },
    },
    async handler(req, reply) {
      void reply.code(204);
      await prisma.subscribersOnAuthors.create({
        data: {
          subscriberId: req.params.userId,
          authorId: req.body.authorId,
        },
      });
    },
  });

  fastify.route({
    url: '/:authorId',
    method: 'DELETE',
    schema: {
      ...unsubscribeFromUserSchema,
      response: {
        204: Type.Void(),
      },
    },
    async handler(req, reply) {
      void reply.code(204);
      await prisma.subscribersOnAuthors.delete({
        where: {
          subscriberId_authorId: {
            subscriberId: req.params.userId,
            authorId: req.params.authorId,
          },
        },
      });
    },
  });
};

export default plugin;
