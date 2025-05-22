import { test } from 'tap';
import { build } from '../helper.js';
import {
  createPost,
  createProfile,
  createUser,
  getPrismaStats,
  gqlQuery,
  subscribeTo,
  unsubscribeFrom,
} from '../utils/requests.js';
import { MemberTypeId } from '../../src/routes/member-types/schemas.js';

await test('gql-loader', async (t) => {
  const app = await build(t);

  await t.test('Get users with their posts, memberTypes.', async (t) => {
    const { body: user1 } = await createUser(app);
    await createPost(app, user1.id);
    await createProfile(app, user1.id, MemberTypeId.BASIC);
    const { body: user2 } = await createUser(app);
    await createPost(app, user2.id);
    await createProfile(app, user2.id, MemberTypeId.BUSINESS);

    await subscribeTo(app, user1.id, user2.id);
    await subscribeTo(app, user2.id, user1.id);

    const {
      body: { operationHistory: beforeHistory },
    } = await getPrismaStats(app);

    const {
      body: { errors },
    } = await gqlQuery(app, {
      query: `query {
        users {
            id
            posts {
              id
            }
            profile {
              id
              memberType {
                id
              }
            }
            userSubscribedTo {
              id
            }
            subscribedToUser {
              id
            }
        }
    }`,
    });

    const {
      body: { operationHistory: afterHistory },
    } = await getPrismaStats(app);

    t.ok(!errors);
    t.ok(afterHistory.length - beforeHistory.length <= 6);

    const history = afterHistory.slice(beforeHistory.length);
    const foundPostCall = history.find(
      ({ model, operation }) => model === 'Post' && operation === 'findMany',
    );
    const foundMemberTypeCall = history.find(
      ({ model, operation }) => model === 'MemberType' && operation === 'findMany',
    );

    t.ok(foundPostCall);
    t.ok(foundMemberTypeCall);
  });

  await t.test('Dataloader should be created per request.', async (t) => {
    const { body: user1 } = await createUser(app);
    const { body: user2 } = await createUser(app);

    await subscribeTo(app, user1.id, user2.id);

    await gqlQuery(app, {
      query: `query {
        users {
          id
          userSubscribedTo {
            id
          }
        }
      }`,
    });

    await unsubscribeFrom(app, user1.id, user2.id);

    const {
      body: { data },
    } = await gqlQuery(app, {
      query: `query {
        users {
          id
          userSubscribedTo {
            id
          }
        }
      }`,
    });

    const foundUser1 = data.users.find(({ id }) => id === user1.id);

    t.ok(foundUser1.userSubscribedTo.length === 0);
  });
});
