import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, GraphQLBoolean, GraphQLEnumType, GraphQLFloat, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLScalarType, GraphQLInputObjectType, ValidationContext, GraphQLDirective } from 'graphql';
import { parse } from 'graphql'
import { buildSchema } from 'graphql';
import { GraphQLObjectType, GraphQLSchema, GraphQLString, validate, specifiedRules ,execute } from 'graphql';
import { Resolver } from 'node:dns';
import { MemberTypeId } from '../member-types/schemas.js';
import { UUID } from 'node:crypto';
import { postFields } from '../posts/schemas.js';
import { UUIDType } from './types/uuid.js';
import { error, info, profile } from 'node:console';
import { resolve } from 'node:path';
import { subscribe } from 'node:diagnostics_channel';
import { describe } from 'node:test';
import { create } from 'node:domain';
import depthLimit from 'graphql-depth-limit';
import { constrainedMemory } from 'node:process';
import DataLoader from 'dataloader';





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
      const allValidationRules = [
        ...specifiedRules,
          depthLimit(5)
      ];
      let document: any;
      document = parse(req.body.query);
      const test = validate(mainShema, document, allValidationRules);
      if(test.length >= 1){
        return {errors: test};
      } 
     
      return graphql({
        schema: mainShema,
        source: req.body.query,
        variableValues: req.body.variables,
        contextValue: {
          prisma,
          dataloaders: new WeakMap(),
        },
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
    profile: { type: profileType, 
      resolve: async (user, args, context, info) => {
        const { dataloaders } = context;
        let dataloader = dataloaders.get(info.fieldNodes);
        if (!dataloader) {
          dataloader = new DataLoader(async (keys) => {
            const profiles = await context.prisma.profile.findMany({
              where: { userId: { in: keys } },
              include: {
                memberType: true,
              }
            });
            return keys.map(key => profiles.find(profile => profile.userId === key));
          }
          );
          dataloaders.set(info.fieldNodes, dataloader);
        }
        return dataloader.load(user.id);
     },    
    },
    posts: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(postType))),
      resolve: async (user, args, context, info) => {
        const { dataloaders } = context;
        let dataloader = dataloaders.get(info.fieldNodes);
        if (!dataloader) {
          dataloader = new DataLoader(async (keys) => {
            const posts = await context.prisma.post.findMany({
              where: { authorId: { in: keys } },
            });
            return keys.map(key => posts.filter(post => post.authorId === key));
          });
          dataloaders.set(info.fieldNodes, dataloader);
        }
        return dataloader.load(user.id);
     },   
    },
    userSubscribedTo: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))),
      // resolve: async (user, argsToArgsConfig, context, info) => {
      //   const { dataloaders } = context;
      //   let dataloader = dataloaders.get(info.fieldNodes);
      //   if (!dataloader) {
      //    dataloader = new DataLoader(async (keys) => {
      //       const posts = await context.prisma.user.findMany({
      //         where: { authorId: { in: keys }, subscribedToUser: { some: { subscriberId: user.id } } },
      //       });
      //       return keys.map(key => posts.filter(post => post.authorId === key));
      //     });
      //     dataloaders.set(info.fieldNodes, dataloader);
      //   }
      //   let bla = dataloader.load(user.id);
      //   return dataloader.load(user.id);
      // }
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

const rootQueryType = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: () => ({
    memberTypes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(memberType))) },
    memberType: { type: memberType,
      args: {
        id: { type: new GraphQLNonNull(memberTypeIdEnum) },
      },
      resolve: async (parent, args, context) => {
        let data = await context.prisma.memberType.findUnique({
          where: {
            id: args.id,
          }
        });
        return data;
      }
    },
    users: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))) },
    user: { type: userType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
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
            userSubscribedTo: true,
            subscribedToUser: true,
          }
        });
        return data;
      }
    },
    posts: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(postType))) },
    post: { type: postType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (parent, args, context) => {
        let data = await context.prisma.post.findUnique({
          where: {
            id: args.id,
          }
        });
        return data;
      }
    },
    profiles: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(profileType))) },
    profile: { type: profileType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
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
      }
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
      resolve: async (parent, args, context, info) => {
        // const { dataloaders } = context;
        // let dataloader = dataloaders.get(info.fieldNodes);
        // if (!dataloader) {
        //   dataloader = new DataLoader(async (keys) => {
        //     const users = await context.prisma.user.findMany({
        //       where: { id: { in: keys } },
        //       include: {
        //         profile: {
        //           include: {
        //             memberType: true,
        //           }
        //         },
        //         posts: true,
        //         userSubscribedTo: true,
        //         subscribedToUser: true,
        //       }
        //     });
        //     return keys.map(key => users.find(user => user.id === key));
        //   });
        //   dataloaders.set(info.fieldNodes, dataloader);
        // }
        // dataloader.loadMany([]);

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
          }
        });
        return data;
      }
    },
  }),
});

const changePostInput  = new GraphQLInputObjectType({
  name: 'ChangePostInput',
  fields: () => ({
    title: { type: GraphQLString },
    content: { type: GraphQLString },
  }),
});

const changeProfileInput = new GraphQLInputObjectType({
  name: 'ChangeProfileInput',
  fields: () => ({
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    memberTypeId: { type: memberTypeIdEnum },
  }),
});

const changeUserInput = new GraphQLInputObjectType({
  name: 'ChangeUserInput',
  fields: () => ({
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
  }),
}); 

const createPostInput = new GraphQLInputObjectType({
  name: 'CreatePostInput',
  fields: () => ({
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: new GraphQLNonNull(UUIDType) },
  }),
}); 

const createProfileInput = new GraphQLInputObjectType({
  name: 'CreateProfileInput',
  fields: () => ({
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    userId: { type: new GraphQLNonNull(UUIDType) },
    memberTypeId: { type: new GraphQLNonNull(memberTypeIdEnum) },
  }),
});

const createUserInput = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});

const mutations = new GraphQLObjectType({
  name: 'Mutations',
  description: 'This is the root mutation type',
  fields: () => ({
    createUser: {
      type: new GraphQLNonNull(userType),
      args: {
        dto: { type: new GraphQLNonNull(createUserInput) },
      },
      resolve: async (_, { dto }, context) => {
        const name = dto.name;
        const balance = dto.balance;
        const user = await context.prisma.user.create({
          data: {
            name: name,
            balance: balance,
          },
        });
        return user;
      }
    },
    createProfile: {
      type: new GraphQLNonNull(profileType),
      args: {
        dto: { type: new GraphQLNonNull(createProfileInput) },
      },
      resolve: async (_, { dto }, context) => {
          const isMale = dto.isMale;
          const yearOfBirth = dto.yearOfBirth;
          const userId = dto.userId;
          const memberTypeId = dto.memberTypeId;
        const profile = await context.prisma.profile.create({
          data: {
            isMale: dto.isMale,
            yearOfBirth: dto.yearOfBirth,
            userId: dto.userId,
            memberTypeId: dto.memberTypeId,
          },
        });
        return profile;
      }
    },
    createPost: {
      type: new GraphQLNonNull(postType),
      args: {
        dto: { type: new GraphQLNonNull(createPostInput) },
      },
      resolve: async (_, { dto }, context) => {
        const title = dto.title;
        const content = dto.content;
        const authorId = dto.authorId;
        const post = await context.prisma.post.create({
          data: {
            title: dto.title,
            content: dto.content,   
            authorId: dto.authorId,
          },
        });
        return post;
      } 
    },
    changePost: {
      type: new GraphQLNonNull(postType),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(changePostInput) },
      },
      resolve: async (parent, args, context) => {
        const id = args.id;
        const title = args.dto.title;
        const content = args.dto.content;
        const post = await context.prisma.post.update({
          where: { id: id },
          data: {
            id: id,
            title: title,
            content: content,
          }
        });
        return post;
      }
    },
    changeProfile: {
      type: new GraphQLNonNull(profileType),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(changeProfileInput) },
      },
      resolve: async (parent, args, context) => {
        const id = args.id;
        const isMale = args.dto.isMale;
        const yearOfBirth = args.dto.yearOfBirth;
        const profile = await context.prisma.profile.update({
          where: { id: id },
          data: {
            id,
              isMale: isMale,
              yearOfBirth: yearOfBirth,
          },
        });
        return profile;
      }
    },
    changeUser: {
      type: new GraphQLNonNull(userType),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(changeUserInput) },
      },
      resolve: async (parent, args, context) => {
        const id = args.id;
        const name = args.dto.name;
        const balance = args.dto.balance;
        const user = await context.prisma.user.update({
          where: { id: id },
          data: {
            id: id,
              name: name,
              balance: balance,
          }
        });
        return user;
      }
    },
    deleteUser: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (parent, args, context) => {   
        const id = args.id;
        const user = await context.prisma.user.delete({
          where: { id: id },
        });
        return 'User deleted successfully';
      }
    },
    deletePost: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (parent, args, context) => {
        const id = args.id;
        const post = await context.prisma.post.delete({
          where: { id: id},
        });
        return 'Post deleted successfully';
      }
    },
    deleteProfile: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (parent, args, context) => {
        const id = args.id;
        const profile = await context.prisma.profile.delete({
          where: { id: id },
        });
        return 'Profile deleted successfully';
      }
    },
    subscribeTo: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (parent, args, context) => {
        const { userId, authorId } = args;
        const subscription = await context.prisma.subscribersOnAuthors.create({
          data: {
            subscriberId: userId,
            authorId: authorId,
          }
        });
        return `User ${userId} subscribed to author ${authorId}`;
      }
    },
    unsubscribeFrom: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (parent, args, context) => {
        const { userId, authorId } = args;
        const subscription = await context.prisma.subscribersOnAuthors.delete({
          where: {
            subscriberId_authorId: {
              subscriberId: userId,
              authorId: authorId,
            }
          }
        });
        return 'unsubscribed successfully';
      }
    },
  })
});






export const mainShema: GraphQLSchema = new GraphQLSchema({
  extensions: {
    validationRules: [depthLimit(1), {}, () => {
        throw new Error('Query depth limit exceeded');
    }],
  },

  query: queryType,
  types: [memberType, memberTypeIdEnum, postType, profileType, userType, rootQueryType],
  mutation: mutations,
});


  