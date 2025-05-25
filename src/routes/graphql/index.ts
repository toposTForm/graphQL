import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, GraphQLBoolean, GraphQLEnumType, GraphQLFloat, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLScalarType } from 'graphql';
import { parse } from 'graphql'
import { buildSchema } from 'graphql';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { Resolver } from 'node:dns';
import { MemberTypeId } from '../member-types/schemas.js';
import { UUID } from 'node:crypto';
import { postFields } from '../posts/schemas.js';
import { UUIDType } from './types/uuid.js';
import { profile } from 'node:console';
import { resolve } from 'node:path';
import { subscribe } from 'node:diagnostics_channel';


const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      // console.log(parse(req.body.query));
      return graphql({
        schema: mainShema,
        source: req.body.query,
        variableValues: req.body.variables,
        contextValue: {
          prisma,
        }
      })
     
    }
});
}
export default plugin;


const memberTypeIdEnum = new GraphQLEnumType({
  name: 'MemberTypeId',
  description: 'Identification of member type',
  values: {
    BASIC: { value: 'BASIC' },
    BUSINESS: { value: 'BUSINESS' },
  }
});

const memberType = new GraphQLObjectType({
  name: 'Member',
  fields: () => ({
    id: { type: new GraphQLNonNull(memberTypeIdEnum) },
    discount: { type: new GraphQLNonNull(GraphQLFloat) },
    postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});

const postType = new GraphQLObjectType({
  name: 'Post',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

const profileType = new GraphQLObjectType({
  name: 'Profile',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType) },
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: {type: new GraphQLNonNull(GraphQLInt) },
    memberType: {type: new GraphQLNonNull(memberType) },
  })
});

const userType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
    profile: { type: profileType },    
    posts: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(postType))) },   
    userSubscribedTo: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))),
      resolve: async (user, args, context) => {
         let data = await context.prisma.user.findMany({
          where: {
            subscribedToUser: {
              some: {
                subscriberId: user.id,
              }
            }
          }
        });
        return data;
      },
     },
    subscribedToUser: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))), 
      resolve: async (user, args, context) => {
      let data = await context.prisma.user.findMany({
          where: {
            userSubscribedTo: {
              some: {
                authorId: user.id,
              }
            }
          }
        });
        return data;
      },
    },
  })
});

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    memberTypes: {
      type: new GraphQLList(memberType),
       resolve: async (parent, args, context) => {
          let data = await context.prisma.memberType.findMany();
          return data;
        },
    },
    memberType: {
      type: memberType,
      args:{
        id: { type: memberTypeIdEnum },
      },
       resolve: async (parent, args, context) => {
          let data = await context.prisma.memberType.findUnique({
            where: {
              id: args.id,
            }
          });
          return data;
        },
    },
    posts: {
      type: new GraphQLList(postType),
      resolve: async (parent, args, context) => {
        let data = await context.prisma.post.findMany();
        return data;
      },
    },
    post: {
      type: postType,
      args:{
        id: { type: UUIDType },
      },
       resolve: async (parent, args, context) => {
          let data = await context.prisma.post.findUnique({
            where: {
              id: args.id,
            }
          });
          return data;
        },
    },
    profiles: {
      type: new GraphQLList(profileType),
       resolve: async (parent, args, context) => {
        let data = await context.prisma.profile.findMany({
        include: {
          memberType: true,
        }
        });
        return data;
      },
    },
    profile: {
      type: profileType,
      args:{
        id: { type: UUIDType },
      },
      resolve: async (parent, args, context) => {
        let data = await context.prisma.profile.findUnique({
          where: {
            id: args.id,
          },
          include: {
            memberType: true,
          }
        });
        return data;
      },
    },
    users: {
      type: new GraphQLList(userType),
      resolve: async (parent, args, context) => {
        let data = await context.prisma.user.findMany({
          include: {
            profile: {
              include: {
                memberType: true,
              }
            },
            posts: true,
            userSubscribedTo: true,
            subscribedToUser: true,
          }
        });
        return data;
      },
    },
    user: {
      type: userType,
      args:{
        id: { type: UUIDType },
        authorId: { type: UUIDType },
        subscriberId: { type: UUIDType },
      },
      resolve: async (parent, args, context) => {
        let data = await context.prisma.user.findUnique({
          where: {
            id: args.id,
          },
          include: {
            profile: {
              include: {
                memberType: true,
              }
            },
            posts: true,
            // userSubscribedTo: true,
            // subscribedToUser: true,
          }
        });
        return data;
      }
    },
  }),
});



export const mainShema: GraphQLSchema = new GraphQLSchema({
  query: queryType,
  types: [memberType, postType, profileType, userType],
  // mutation: Mutations,
});