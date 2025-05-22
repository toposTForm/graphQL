import { Type } from '@fastify/type-provider-typebox';

export const prismaStatsSchema = Type.Object({
  operationHistory: Type.Array(
    Type.Object({
      model: Type.String(),
      operation: Type.String(),
      args: Type.Any(),
    }),
  ),
});
