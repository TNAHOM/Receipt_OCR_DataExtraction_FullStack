import { gql } from "graphql-tag";
import { receiptTypeDef } from "./typeDefs/receipt.typeDef";
import { itemTypeDef } from "./typeDefs/item.typeDef";

import { receiptResolver } from "./resolvers/receipt.resolver";
import { itemResolver } from "./resolvers/item.resolver";
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";

const rootTypeDefs = gql`
  type Query {
    _empty: String
  }
  type Mutation {
    _empty: String
  }
`;

export const typeDefs = [rootTypeDefs, itemTypeDef, receiptTypeDef];
export const resolvers = [{ Upload: GraphQLUpload }, itemResolver, receiptResolver];
