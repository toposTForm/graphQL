import fp from 'fastify-plugin';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';

export default fp(async (fastify) => {
  fastify.addHook('onRoute', (route) => {
    if (!route.schema) {
      route.schema = {};
    }

    let { url } = route;
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }

    const parts = url.split('/');
    if (parts.at(-1)?.includes(':')) {
      route.schema.tags = [parts.slice(0, -1).join('/')];
    } else {
      route.schema.tags = [url];
    }
  });

  await fastify.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'GraphQL basics',
        description: 'Good luck with the task.',
        version: ':D',
      },
    },
  });
  await fastify.register(fastifySwaggerUi, {
    routePrefix: 'docs',
  });
});
