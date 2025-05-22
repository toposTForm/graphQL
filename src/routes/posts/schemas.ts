import { Type } from '@fastify/type-provider-typebox';
import { userFields } from '../users/schemas.js';

export const postFields = {
  id: Type.String({
    format: 'uuid',
  }),
  title: Type.String(),
  content: Type.String(),
  authorId: userFields.id,
};

export const postSchema = Type.Object({
  ...postFields,
});

export const getPostByIdSchema = {
  params: Type.Object(
    {
      postId: postFields.id,
    },
    {
      additionalProperties: false,
    },
  ),
};

export const createPostSchema = {
  body: Type.Object(
    {
      title: postFields.title,
      content: postFields.content,
      authorId: postFields.authorId,
    },
    {
      additionalProperties: false,
    },
  ),
};

export const changePostByIdSchema = {
  params: getPostByIdSchema.params,
  body: Type.Partial(
    Type.Object({
      title: postFields.title,
      content: postFields.content,
    }),
    {
      additionalProperties: false,
    },
  ),
};
