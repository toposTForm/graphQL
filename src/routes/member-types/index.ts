import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import { getMemberTypeByIdSchema, memberTypeSchema } from './schemas.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma, httpErrors } = fastify;

  fastify.route({
    url: '/',
    method: 'GET',
    schema: {
      response: {
        200: Type.Array(memberTypeSchema),
      },
    },
    async handler() {
      return prisma.memberType.findMany();
    },
  });

  fastify.route({
    url: '/:memberTypeId',
    method: 'GET',
    schema: {
      ...getMemberTypeByIdSchema,
      response: {
        200: memberTypeSchema,
        404: Type.Null(),
      },
    },
    async handler(req) {
      const memberType = await prisma.memberType.findUnique({
        where: {
          id: req.params.memberTypeId,
        },
      });
      if (memberType === null) {
        throw httpErrors.notFound();
      }
      return memberType;
    },
  });
};

export default plugin;
