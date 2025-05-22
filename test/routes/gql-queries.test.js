import { randomUUID } from 'node:crypto';
import { test } from 'tap';
import { build } from '../helper.js';
import {
  createPost,
  createProfile,
  createUser,
  getMemberTypes,
  getPosts,
  getProfiles,
  getUsers,
  gqlQuery,
  subscribeTo,
} from '../utils/requests.js';
import { MemberTypeId } from '../../src/routes/member-types/schemas.js';

await test('gql-queries', async (t) => {
  const app = await build(t);

  await t.test('Get all resources.', async (t) => {
    const { body: user1 } = await createUser(app);
    await createPost(app, user1.id);
    await createProfile(app, user1.id, MemberTypeId.BASIC);

    const { body: memberTypes } = await getMemberTypes(app);
    const { body: posts } = await getPosts(app);
    const { body: users } = await getUsers(app);
    const { body: profiles } = await getProfiles(app);

    const {
      body: { data },
    } = await gqlQuery(app, {
      query: `query {
        memberTypes {
            id
            discount
            postsLimitPerMonth
        }
        posts {
            id
            title
            content
        }
        users {
            id
            name
            balance
        }
        profiles {
            id
            isMale
            yearOfBirth
        }
    }`,
    });

    t.ok(data.memberTypes.length === memberTypes.length);
    t.ok(data.posts.length === posts.length);
    t.ok(data.users.length === users.length);
    t.ok(data.profiles.length === profiles.length);
  });

  await t.test('Get all resources by their id.', async (t) => {
    const { body: user1 } = await createUser(app);
    const { body: post1 } = await createPost(app, user1.id);
    const { body: profile1 } = await createProfile(app, user1.id, MemberTypeId.BASIC);

    const {
      body: { data },
    } = await gqlQuery(app, {
      query: `query ($userId: UUID!, $profileId: UUID!, $memberTypeId: MemberTypeId!, $postId: UUID!) {
        memberType(id: $memberTypeId) {
            id
            discount
            postsLimitPerMonth
        }
        post(id: $postId) {
            id
            title
            content
        }
        user(id: $userId) {
            id
            name
            balance
        }
        profile(id: $profileId) {
            id
            isMale
            yearOfBirth
        }
    }`,
      variables: {
        userId: user1.id,
        profileId: profile1.id,
        memberTypeId: MemberTypeId.BASIC,
        postId: post1.id,
      },
    });

    t.ok(data.memberType.id === MemberTypeId.BASIC);
    t.ok(data.post.id === post1.id);
    t.ok(data.user.id === user1.id);
    t.ok(data.profile.id === profile1.id);
  });

  await t.test('Get non-existent resources by their id.', async (t) => {
    const { body: user1 } = await createUser(app);

    const {
      body: { data, errors },
    } = await gqlQuery(app, {
      query: `query ($nullUserId: UUID!, $userWithNullProfileId: UUID!, $profileId: UUID!, $postId: UUID!) {
        user(id: $nullUserId) {
            id
        }
        post(id: $postId) {
            id
        }
        profile(id: $profileId) {
            id
        }
        userWithNullProfile: user(id: $userWithNullProfileId) {
            id
            profile {
              id
            }
        }
    }`,
      variables: {
        userWithNullProfileId: user1.id,
        nullUserId: randomUUID(),
        profileId: randomUUID(),
        postId: randomUUID(),
      },
    });

    t.ok(!errors);
    t.ok(data.post === null);
    t.ok(data.profile === null);
    t.ok(data.user === null);
    t.ok(data.userWithNullProfile.profile === null);
  });

  await t.test('Get user/users with his/their posts, profile, memberType.', async (t) => {
    const { body: user1 } = await createUser(app);
    const { body: post1 } = await createPost(app, user1.id);
    const { body: profile1 } = await createProfile(app, user1.id, MemberTypeId.BASIC);

    const {
      body: { data: dataUser },
    } = await gqlQuery(app, {
      query: `query ($userId: UUID!) {
          user(id: $userId) {
              id
              profile {
                  id
                  memberType {
                      id
                  }
              }
              posts {
                  id
              }
          }
      }`,
      variables: {
        userId: user1.id,
      },
    });
    const {
      body: { data: dataUsers },
    } = await gqlQuery(app, {
      query: `query {
          users {
              id
              profile {
                  id
                  memberType {
                      id
                  }
              }
              posts {
                  id
              }
          }
      }`,
    });

    t.ok(dataUser.user.id === user1.id);
    t.ok(dataUser.user.profile.id === profile1.id);
    t.ok(dataUser.user.profile.memberType?.id === MemberTypeId.BASIC);
    t.ok(dataUser.user.posts[0].id === post1.id);

    const foundUser1 = dataUsers.users.find((user) => user.id === user1.id);
    t.same(foundUser1, dataUser.user);
  });

  await t.test(`Get user by id with his subs.`, async (t) => {
    const { body: user1 } = await createUser(app);
    const { body: user2 } = await createUser(app);
    const { body: user3 } = await createUser(app);

    await subscribeTo(app, user1.id, user2.id);
    await subscribeTo(app, user3.id, user1.id);

    const {
      body: { data: data },
    } = await gqlQuery(app, {
      query: `query ($userId: UUID!) {
          user(id: $userId) {
              id
              userSubscribedTo {
                  id
                  name
                  subscribedToUser {
                      id
                  }
              }
              subscribedToUser {
                  id
                  name
                  userSubscribedTo {
                      id
                  }
              }
          }
      }`,
      variables: {
        userId: user1.id,
      },
    });

    t.ok(data.user.userSubscribedTo[0].id === user2.id);
    t.ok(data.user.userSubscribedTo[0].name === user2.name);
    t.ok(data.user.userSubscribedTo[0].subscribedToUser[0].id === user1.id);

    t.ok(data.user.subscribedToUser[0].id === user3.id);
    t.ok(data.user.subscribedToUser[0].name === user3.name);
    t.ok(data.user.subscribedToUser[0].userSubscribedTo[0].id === user1.id);
  });
});
