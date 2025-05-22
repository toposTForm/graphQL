import { Type } from '@fastify/type-provider-typebox';
import { getUserByIdSchema, userFields } from '../../schemas.js';

export const subscribeToUserSchema = {
  params: getUserByIdSchema.params,
  body: Type.Object(
    {
      authorId: userFields.id,
    },
    {
      additionalProperties: false,
    },
  ),
};

export const unsubscribeFromUserSchema = {
  params: Type.Object(
    {
      userId: userFields.id,
      authorId: userFields.id,
    },
    {
      additionalProperties: false,
    },
  ),
};
