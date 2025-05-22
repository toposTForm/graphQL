import { randomUUID } from 'node:crypto';
import { test } from 'tap';
import { build } from '../helper.js';
import {
  createPost,
  createProfile,
  createUser,
  getPost,
  getProfile,
  getUser,
  gqlQuery,
  subscribeTo,
  subscribedToUser,
} from '../utils/requests.js';
import { MemberTypeId } from '../../src/routes/member-types/schemas.js';
import {
  genCreatePostDto,
  genCreateProfileDto,
  genCreateUserDto,
} from '../utils/fake.js';

await test('gql-mutations', async (t) => {
  const app = await build(t);

  await t.test('Create resources.', async (t) => {
    const { body: user1 } = await createUser(app);

    const {
      body: { data, errors },
    } = await gqlQuery(app, {
      query: `mutation ($postDto: CreatePostInput!, $userDto: CreateUserInput!, $profileDto: CreateProfileInput!) {
        createPost(dto: $postDto) {
            id
        }
        createUser(dto: $userDto) {
            id
        }
        createProfile(dto: $profileDto) {
            id
        }
    }`,
      variables: {
        userDto: genCreateUserDto(),
        postDto: genCreatePostDto(user1.id),
        profileDto: genCreateProfileDto(user1.id, MemberTypeId.BUSINESS),
      },
    });

    const { body: foundCreatedPost } = await getPost(app, data.createPost.id);
    const { body: foundCreatedUser } = await getUser(app, data.createUser.id);
    const { body: foundCreatedProfile } = await getProfile(app, data.createProfile.id);

    t.ok(!errors);
    t.ok(foundCreatedPost);
    t.ok(foundCreatedUser);
    t.ok(foundCreatedProfile);
  });

  await t.test('Create profile => fail; invalid dto.yearOfBirth.', async (t) => {
    const {
      body: { errors },
    } = await gqlQuery(app, {
      query: `mutation ($profileDto: CreateProfileInput!) {
        createProfile(dto: $profileDto) {
            id
        }
    }`,
      variables: {
        profileDto: {
          ...genCreateProfileDto(randomUUID(), MemberTypeId.BUSINESS),
          yearOfBirth: 123.321,
        },
      },
    });

    t.ok(errors.length === 1);
    const message = errors[0].message;
    t.ok(message.includes(`Int cannot represent non-integer value: 123.321`));
  });

  await t.test('Delete resources by id.', async (t) => {
    const { body: user1 } = await createUser(app);
    const { body: post1 } = await createPost(app, user1.id);
    const { body: profile1 } = await createProfile(app, user1.id, MemberTypeId.BUSINESS);

    const {
      body: { errors },
    } = await gqlQuery(app, {
      // https://graphql.org/learn/mutations/#multiple-fields-in-mutations
      query: `mutation ($userId: UUID!, $profileId: UUID!, $postId: UUID!) {
        deletePost(id: $postId)
        deleteProfile(id: $profileId)
        deleteUser(id: $userId)
    }`,
      variables: {
        postId: post1.id,
        profileId: profile1.id,
        userId: user1.id,
      },
    });

    const { body: foundDeletedPost } = await getPost(app, post1.id);
    const { body: foundCreatedUser } = await getUser(app, user1.id);
    const { body: foundCreatedProfile } = await getProfile(app, profile1.id);

    t.ok(!errors);
    t.ok(foundDeletedPost === null);
    t.ok(foundCreatedUser === null);
    t.ok(foundCreatedProfile === null);
  });

  await t.test('Change resources by id.', async (t) => {
    const { body: user1 } = await createUser(app);
    const { body: post1 } = await createPost(app, user1.id);
    const { body: profile1 } = await createProfile(app, user1.id, MemberTypeId.BUSINESS);

    const changedName = genCreateUserDto().name;
    const changedTitle = genCreatePostDto('').title;
    const changedIsMale = !profile1.isMale;

    const {
      body: { data, errors },
    } = await gqlQuery(app, {
      query: `
      mutation ($postId: UUID!, $postDto: ChangePostInput!, $profileId: UUID!, $profileDto: ChangeProfileInput!, $userId: UUID!, $userDto: ChangeUserInput!) {
        changePost(id: $postId, dto: $postDto) {
            id
        }
        changeProfile(id: $profileId, dto: $profileDto) {
            id
        }
        changeUser(id: $userId, dto: $userDto) {
            id
        }
      }
      `,
      variables: {
        postId: post1.id,
        postDto: { title: changedTitle },
        profileId: profile1.id,
        profileDto: { isMale: changedIsMale },
        userId: user1.id,
        userDto: { name: changedName },
      },
    });

    const { body: foundChangedPost } = await getPost(app, data.changePost.id);
    const { body: foundChangedUser } = await getUser(app, data.changeUser.id);
    const { body: foundChangedProfile } = await getProfile(app, data.changeProfile.id);

    t.ok(!errors);
    t.ok(foundChangedPost.title === changedTitle);
    t.ok(foundChangedUser.name === changedName);
    t.ok(foundChangedProfile.isMale === changedIsMale);
  });

  await t.test('Change profile => fail; invalid dto.userId.', async (t) => {
    const {
      body: { errors },
    } = await gqlQuery(app, {
      query: `mutation ($id: UUID!, $dto: ChangeProfileInput!) {
        changeProfile(id: $id, dto: $dto) {
            id
        }
    }`,
      variables: {
        id: randomUUID(),
        dto: {
          userId: randomUUID(),
        },
      },
    });

    t.ok(errors.length === 1);
  });

  await t.test('Subs mutations.', async (t) => {
    const { body: user1 } = await createUser(app);
    const { body: user2 } = await createUser(app);
    const { body: user3 } = await createUser(app);
    const { body: user4 } = await createUser(app);

    await subscribeTo(app, user3.id, user4.id);

    const {
      body: { errors },
    } = await gqlQuery(app, {
      query: `mutation ($userId1: UUID!, $authorId1: UUID!, $userId2: UUID!, $authorId2: UUID!) {
        subscribeTo(userId: $userId1, authorId: $authorId1)
        unsubscribeFrom(userId: $userId2, authorId: $authorId2)
    }`,
      variables: {
        userId1: user1.id,
        authorId1: user2.id,
        userId2: user3.id,
        authorId2: user4.id,
      },
    });

    const { body: subscribedToUser2 } = await subscribedToUser(app, user2.id);
    const { body: subscribedToUser4 } = await subscribedToUser(app, user4.id);

    t.ok(!errors);
    t.ok(subscribedToUser2[0].id === user1.id);
    t.ok(subscribedToUser4.length === 0);
  });
});
