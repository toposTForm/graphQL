import { test } from 'tap';
import { build } from '../helper.js';
import { createUser, gqlQuery, subscribeTo } from '../utils/requests.js';

await test('gql-rule', async (t) => {
  const app = await build(t);

  await t.test('Trigger depth limit rule.', async (t) => {
    const { body: user1 } = await createUser(app);

    const {
      body: { errors },
    } = await gqlQuery(app, {
      query: `query ($userId: UUID!) {
        user(id: $userId) {
            id
            userSubscribedTo {
              id
              userSubscribedTo {
                id
                userSubscribedTo {
                  id
                  userSubscribedTo {
                    id
                    userSubscribedTo {
                      id
                    }
                  }
                }
              }
            }
        }
    }`,
      variables: {
        userId: user1.id,
      },
    });

    t.ok(errors.length === 1);
    const message = errors[0].message;
    // Error message from graphql-depth-limit package
    t.ok(message.endsWith('exceeds maximum operation depth of 5'));
  });
});
