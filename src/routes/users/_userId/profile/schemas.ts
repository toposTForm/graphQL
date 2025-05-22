import { Type } from '@fastify/type-provider-typebox';
import { userFields } from '../../schemas.js';

export const getProfileByUserIdSchema = {
  params: Type.Object(
    {
      userId: userFields.id,
    },
    {
      additionalProperties: false,
    },
  ),
};
