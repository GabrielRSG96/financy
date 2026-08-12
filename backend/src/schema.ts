import { makeExecutableSchema } from '@graphql-tools/schema'
import { DateTimeResolver } from 'graphql-scalars'
import { categoryResolvers } from './modules/category/resolvers.js'
import { categoryTypeDefs } from './modules/category/typeDefs.js'
import { transactionResolvers } from './modules/transaction/resolvers.js'
import { transactionTypeDefs } from './modules/transaction/typeDefs.js'
import { userResolvers } from './modules/user/resolvers.js'
import { userTypeDefs } from './modules/user/typeDefs.js'

export const schema = makeExecutableSchema({
  typeDefs: [userTypeDefs, categoryTypeDefs, transactionTypeDefs],
  resolvers: [
    { DateTime: DateTimeResolver },
    userResolvers,
    categoryResolvers,
    transactionResolvers,
  ],
})
