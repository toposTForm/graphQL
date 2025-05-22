import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import { getProfileByUserIdSchema } from './schemas.js';
import { profileSchema } from '../../../profiles/schemas.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma, httpErrors } = fastify;

  fastify.route({
    url: '/',
    method: 'GET',
    schema: {
      ...getProfileByUserIdSchema,
      response: {
        200: profileSchema,
        404: Type.Null(),
      },
    },
    async handler(req) {
      const profile = await prisma.profile.findUnique({
        where: {
          userId: req.params.userId,
        },
      });
      if (profile === null) {
        throw httpErrors.notFound();
      }
      return profile;
    },
  });
};

export default plugin;
