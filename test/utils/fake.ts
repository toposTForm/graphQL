import { randomInt, randomUUID } from 'node:crypto';
import { createUserSchema } from '../../src/routes/users/schemas.js';
import { Static } from '@fastify/type-provider-typebox';
import { createProfileSchema } from '../../src/routes/profiles/schemas.js';
import { createPostSchema } from '../../src/routes/posts/schemas.js';
import { MemberTypeId } from '../../src/routes/member-types/schemas.js';

export function genCreateUserDto(): Static<(typeof createUserSchema)['body']> {
  return {
    name: randomUUID(),
    balance: randomInt(0, 100) + +Math.random().toFixed(3),
  };
}

export function genCreateProfileDto(
  userId: string,
  memberTypeId: MemberTypeId,
): Static<(typeof createProfileSchema)['body']> {
  return {
    userId,
    memberTypeId,
    isMale: !randomInt(0, 2),
    yearOfBirth: randomInt(1950, 2000),
  };
}

export function genCreatePostDto(
  authorId: string,
): Static<(typeof createPostSchema)['body']> {
  return {
    authorId,
    content: randomUUID(),
    title: randomUUID(),
  };
}
