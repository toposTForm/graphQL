import { test } from 'tap';
import { build } from '../helper.js';
import { createUser, getPrismaStats, gqlQuery, subscribeTo } from '../utils/requests.js';

await test('gql-loader-prime', async (t) => {
  const app = await build(t);

  await t.test('Get users with subs.', async (t) => {
    const { body: user1 } = await createUser(app);
    const { body: user2 } = await createUser(app);

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
    t.ok(afterHistory.length - beforeHistory.length === 1);

    const history = afterHistory.slice(beforeHistory.length);
    const foundUserCall = history.find(
      ({ model, operation, args }) =>
        model === 'User' &&
        operation === 'findMany' &&
        args.include.subscribedToUser === true &&
        args.include.userSubscribedTo === true,
    );
    t.ok(foundUserCall);
  });

  await t.test(
    `Get users with userSubscribedTo.
    Include only userSubscribedTo relation => parse GraphQLResolveInfo.`,
    async (t) => {
      const { body: user1 } = await createUser(app);
      const { body: user2 } = await createUser(app);

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
            userSubscribedTo {
              id
            }
        }
    }`,
      });

      const {
        body: { operationHistory: afterHistory },
      } = await getPrismaStats(app);

      t.ok(!errors);
      t.ok(afterHistory.length - beforeHistory.length === 1);

      const history = afterHistory.slice(beforeHistory.length);
      const foundUserCall = history.find(
        ({ model, operation, args }) =>
          model === 'User' &&
          operation === 'findMany' &&
          args.include.userSubscribedTo === true &&
          Boolean(args.include.subscribedToUser) === false,
      );
      t.ok(foundUserCall);
    },
  );
});
