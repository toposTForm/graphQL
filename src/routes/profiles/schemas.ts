import { Type } from '@fastify/type-provider-typebox';
import { memberTypeFields } from '../member-types/schemas.js';
import { userFields } from '../users/schemas.js';

export const profileFields = {
  id: Type.String({
    format: 'uuid',
  }),
  isMale: Type.Boolean(),
  yearOfBirth: Type.Integer(),
  userId: userFields.id,
  memberTypeId: memberTypeFields.id,
};

export const profileSchema = Type.Object({
  ...profileFields,
});

export const getProfileByIdSchema = {
  params: Type.Object(
    {
      profileId: profileFields.id,
    },
    {
      additionalProperties: false,
    },
  ),
};

export const createProfileSchema = {
  body: Type.Object(
    {
      isMale: profileFields.isMale,
      yearOfBirth: profileFields.yearOfBirth,
      memberTypeId: profileFields.memberTypeId,
      userId: profileFields.userId,
    },
    {
      additionalProperties: false,
    },
  ),
};

export const changeProfileByIdSchema = {
  params: getProfileByIdSchema.params,
  body: Type.Partial(
    Type.Object({
      isMale: profileFields.isMale,
      yearOfBirth: profileFields.yearOfBirth,
      memberTypeId: profileFields.memberTypeId,
    }),
    {
      additionalProperties: false,
    },
  ),
};
