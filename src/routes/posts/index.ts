import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import {
  changePostByIdSchema,
  createPostSchema,
  getPostByIdSchema,
  postSchema,
} from './schemas.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma, httpErrors } = fastify;

  fastify.route({
    url: '/',
    method: 'GET',
    schema: {
      response: {
        200: Type.Array(postSchema),
      },
    },
    async handler() {
      return prisma.post.findMany();
    },
  });

  fastify.route({
    url: '/:postId',
    method: 'GET',
    schema: {
      ...getPostByIdSchema,
      response: {
        200: postSchema,
        404: Type.Null(),
      },
    },
    async handler(req) {
      const post = await prisma.post.findUnique({
        where: {
          id: req.params.postId,
        },
      });
      if (post === null) {
        throw httpErrors.notFound();
      }
      return post;
    },
  });

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createPostSchema,
      response: {
        200: postSchema,
      },
    },
    async handler(req) {
      return prisma.post.create({
        data: req.body,
      });
    },
  });

  fastify.route({
    url: '/:postId',
    method: 'PATCH',
    schema: {
      ...changePostByIdSchema,
      response: {
        200: postSchema,
      },
    },
    async handler(req) {
      return prisma.post.update({
        where: { id: req.params.postId },
        data: req.body,
      });
    },
  });

  fastify.route({
    url: '/:postId',
    method: 'DELETE',
    schema: {
      ...getPostByIdSchema,
      response: {
        204: Type.Void(),
      },
    },
    async handler(req, reply) {
      void reply.code(204);
      await prisma.post.delete({
        where: {
          id: req.params.postId,
        },
      });
    },
  });
};

export default plugin;
