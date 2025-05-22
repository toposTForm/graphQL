import fp from 'fastify-plugin';
import { fastifyEnv } from '@fastify/env';
import { Type, Static } from '@fastify/type-provider-typebox';

const schema = Type.Object({
  FASTIFY_PORT: Type.Integer(),
});

export default fp(async (fastify) =>
  fastify.register(fastifyEnv, {
    dotenv: true,
    schema,
  }),
);

declare module 'fastify' {
  interface FastifyInstance {
    config: Static<typeof schema>;
  }
}
