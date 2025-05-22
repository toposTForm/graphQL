import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import {
  changeUserByIdSchema,
  createUserSchema,
  getUserByIdSchema,
  userSchema,
} from './schemas.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma, httpErrors } = fastify;

  fastify.route({
    url: '/',
    method: 'GET',
    schema: {
      response: {
        200: Type.Array(userSchema),
      },
    },
    async handler() {
      return prisma.user.findMany();
    },
  });

  fastify.route({
    url: '/:userId',
    method: 'GET',
    schema: {
      ...getUserByIdSchema,
      response: {
        200: userSchema,
        404: Type.Null(),
      },
    },
    async handler(req) {
      const user = await prisma.user.findUnique({
        where: {
          id: req.params.userId,
        },
      });
      if (user === null) {
        throw httpErrors.notFound();
      }
      return user;
    },
  });

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createUserSchema,
      response: {
        200: userSchema,
      },
    },
    async handler(req) {
      return prisma.user.create({
        data: req.body,
      });
    },
  });

  fastify.route({
    url: '/:userId',
    method: 'DELETE',
    schema: {
      ...getUserByIdSchema,
      response: {
        204: Type.Void(),
      },
    },
    async handler(req, reply) {
      void reply.code(204);
      await prisma.user.delete({
        where: {
          id: req.params.userId,
        },
      });
    },
  });

  fastify.route({
    url: '/:userId',
    method: 'PATCH',
    schema: {
      ...changeUserByIdSchema,
      response: {
        200: userSchema,
      },
    },
    async handler(req) {
      return prisma.user.update({
        where: { id: req.params.userId },
        data: req.body,
      });
    },
  });
};

export default plugin;
