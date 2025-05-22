import { FastifyInstance } from 'fastify';
import { Static } from '@sinclair/typebox';
import {
  createGqlResponseSchema,
  gqlResponseSchema,
} from '../../src/routes/graphql/schemas.js';
import { genCreatePostDto, genCreateProfileDto, genCreateUserDto } from './fake.js';
import { userSchema } from '../../src/routes/users/schemas.js';
import { profileSchema } from '../../src/routes/profiles/schemas.js';
import { postSchema } from '../../src/routes/posts/schemas.js';
import { MemberTypeId, memberTypeSchema } from '../../src/routes/member-types/schemas.js';
import { prismaStatsSchema } from '../../src/routes/stats/schemas.js';

type UserBody = Static<typeof userSchema>;
type ProfileBody = Static<typeof profileSchema>;
type PostBody = Static<typeof postSchema>;
type MemberTypeBody = Static<typeof memberTypeSchema>;

export async function gqlQuery(
  app: FastifyInstance,
  dto: Static<(typeof createGqlResponseSchema)['body']>,
) {
  const res = await app.inject({
    url: `/graphql`,
    method: 'POST',
    body: dto,
  });
  const body = (await res.json()) as Static<typeof gqlResponseSchema>;
  return { res, body };
}

export async function getUsers(app: FastifyInstance) {
  const res = await app.inject({
    url: `/users`,
    method: 'GET',
  });
  const body = (await res.json()) as UserBody[];
  return { res, body };
}

export async function getProfiles(app: FastifyInstance) {
  const res = await app.inject({
    url: `/profiles`,
    method: 'GET',
  });
  const body = (await res.json()) as ProfileBody[];
  return { res, body };
}

export async function getPosts(app: FastifyInstance) {
  const res = await app.inject({
    url: `/posts`,
    method: 'GET',
  });
  const body = (await res.json()) as PostBody[];
  return { res, body };
}

export async function getMemberTypes(app: FastifyInstance) {
  const res = await app.inject({
    url: `/member-types`,
    method: 'GET',
  });
  const body = (await res.json()) as MemberTypeBody[];
  return { res, body };
}

export async function getUser(app: FastifyInstance, id: string) {
  const res = await app.inject({
    url: `/users/${id}`,
    method: 'GET',
  });
  const body = (await res.json()) as UserBody;
  return { res, body };
}

export async function getProfile(app: FastifyInstance, id: string) {
  const res = await app.inject({
    url: `/profiles/${id}`,
    method: 'GET',
  });
  const body = (await res.json()) as ProfileBody;
  return { res, body };
}

export async function getPost(app: FastifyInstance, id: string) {
  const res = await app.inject({
    url: `/posts/${id}`,
    method: 'GET',
  });
  const body = (await res.json()) as PostBody;
  return { res, body };
}

export async function getMemberType(app: FastifyInstance, id: string) {
  const res = await app.inject({
    url: `/member-types/${id}`,
    method: 'GET',
  });
  const body = (await res.json()) as MemberTypeBody;
  return { res, body };
}

export async function createUser(app: FastifyInstance) {
  const res = await app.inject({
    url: '/users',
    method: 'POST',
    payload: genCreateUserDto(),
  });
  const body = (await res.json()) as UserBody;
  return { res, body };
}

export async function createProfile(
  app: FastifyInstance,
  userId: string,
  memberTypeId: MemberTypeId,
) {
  const res = await app.inject({
    url: '/profiles',
    method: 'POST',
    payload: genCreateProfileDto(userId, memberTypeId),
  });
  const body = (await res.json()) as ProfileBody;
  return { res, body };
}

export async function createPost(app: FastifyInstance, authorId: string) {
  const res = await app.inject({
    url: '/posts',
    method: 'POST',
    payload: genCreatePostDto(authorId),
  });
  const body = (await res.json()) as PostBody;
  return { res, body };
}

export async function subscribeTo(
  app: FastifyInstance,
  userId: string,
  authorId: string,
) {
  const res = await app.inject({
    url: `/users/${userId}/user-subscribed-to/`,
    method: 'POST',
    payload: {
      authorId,
    },
  });
  return { res, body: {} };
}

export async function subscribedToUser(app: FastifyInstance, userId: string) {
  const res = await app.inject({
    url: `/users/${userId}/subscribed-to-user`,
    method: 'GET',
  });
  const body = (await res.json()) as UserBody[];
  return { res, body };
}

export async function unsubscribeFrom(
  app: FastifyInstance,
  userId: string,
  authorId: string,
) {
  const res = await app.inject({
    url: `/users/${userId}/user-subscribed-to/${authorId}`,
    method: 'DELETE',
  });
  return { res, body: {} };
}

export async function getPrismaStats(app: FastifyInstance) {
  const res = await app.inject({
    url: '/stats/prisma',
    method: 'GET',
  });
  const body = (await res.json()) as Static<typeof prismaStatsSchema>;
  return { res, body };
}
