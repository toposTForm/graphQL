import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import {
  changeProfileByIdSchema,
  createProfileSchema,
  getProfileByIdSchema,
  profileSchema,
} from './schemas.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma, httpErrors } = fastify;

  fastify.route({
    url: '/',
    method: 'GET',
    schema: {
      response: {
        200: Type.Array(profileSchema),
      },
    },
    async handler() {
      return prisma.profile.findMany();
    },
  });

  fastify.route({
    url: '/:profileId',
    method: 'GET',
    schema: {
      ...getProfileByIdSchema,
      response: {
        200: profileSchema,
        404: Type.Null(),
      },
    },
    async handler(req) {
      const profile = await prisma.profile.findUnique({
        where: {
          id: req.params.profileId,
        },
      });
      if (profile === null) {
        throw httpErrors.notFound();
      }
      return profile;
    },
  });

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createProfileSchema,
      response: {
        200: profileSchema,
      },
    },
    async handler(req) {
      return prisma.profile.create({
        data: req.body,
      });
    },
  });

  fastify.route({
    url: '/:profileId',
    method: 'PATCH',
    schema: {
      ...changeProfileByIdSchema,
      response: {
        200: profileSchema,
      },
    },
    async handler(req) {
      return prisma.profile.update({
        where: { id: req.params.profileId },
        data: req.body,
      });
    },
  });

  fastify.route({
    url: '/:profileId',
    method: 'DELETE',
    schema: {
      ...getProfileByIdSchema,
      response: {
        204: Type.Void(),
      },
    },
    async handler(req, reply) {
      void reply.code(204);
      await prisma.profile.delete({
        where: {
          id: req.params.profileId,
        },
      });
    },
  });
};

export default plugin;
