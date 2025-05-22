## Assignment: Graphql

### Tasks:  

1. Add logic to the graphql endpoint at: ./src/routes/graphql.  
   Constraints and logic for GQL queries should align with the existing RESTful implementation.  
   The resulting GQL schema should match the [required structure](https://github.com/nosbog/rsschool-nodejs-task-graphql/blob/main/schema.graphql).  
   1.1. Test queries: npm run test-queries  
   1.2. Test mutations: npm run test-mutations  
2. Limit GraphQL query complexity by depth using the [graphql-depth-limit](https://www.npmjs.com/package/graphql-depth-limit) package.  
   Set the depth limit to 5.  
   2.1. Test depth rule: npm run test-rule  
3. Solve the n+1 GraphQL problem using [DataLoader](https://www.npmjs.com/package/dataloader).  
   Use only one [findMany](https://www.prisma.io/docs/orm/reference/prisma-client-reference#findmany) call per loader.  
   3.1. Test dataloader: npm run test-loader  
   3.2. Test dataloader-cache: npm run test-loader-prime  
   When querying all users, preload them into the DataLoader cache to avoid redundant database calls for subs.  
   Determine if a user is a sub by performing a join (via [include](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#include)), but only when the query requires subs. Use [graphql-parse-resolve-info](https://github.com/graphile/graphile-engine/tree/master/packages/graphql-parse-resolve-info) to parse GraphQLResolveInfo and conditionally apply the join.

### Info:  

Do not add new npm dependencies.  
Modify/add code only in ./src/routes/graphql.  
Use a [code-first](https://github.dev/graphql/graphql-js/blob/ffa18e9de0ae630d7e5f264f72c94d497c70016b/src/__tests__/starWarsSchema.ts) approach for the GQL server.   
Avoid creating index.ts files (reserved for Fastify plugins).  
Adhere to the repository’s style configurations.  
Ensure critical files remain unchanged: npm run test-integrity.  

### Workflow for tests:  

A test ([[test-name].test.js](https://github.com/nosbog/rsschool-nodejs-task-graphql/tree/main/test/routes)) is considered failed if it is partially completed.  
Subsequent tests are considered failed if any previous test is failed.  

Steps to get started:  

1. Install dependencies: npm ci  
2. Create .env file (copy from .env.example): cp .env.example .env  
3. Create database.db file: touch ./prisma/database.db  
4. Apply database migrations: npx prisma migrate deploy  
5. Seed database: npx prisma db seed  
6. Start server: npm run start  

Useful things:  

- Database GUI: npx prisma studio  
- Reset database: npx prisma migrate reset (includes seeding)  
- Test REST API (Swagger): [::1]:8000/docs  
- Use a GraphQL [client](https://learning.postman.com/docs/sending-requests/graphql/graphql-overview/) with [introspection](https://graphql.org/learn/introspection/) support for testing.  
