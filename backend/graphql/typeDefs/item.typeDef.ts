import { gql } from "graphql-tag";

export const itemTypeDef = gql`
  type Item {
    id: ID!
    name: String
    quantity: Int
  price: Float
  lineTotal: Float
    receiptId: ID
    receipt: Receipt
  }

  input ItemCreateInput {
    name: String
    quantity: Int
  price: Float
  lineTotal: Float
    receiptId: ID!
  }

  input ItemUpdateInput {
    name: String
    quantity: Int
  price: Float
  lineTotal: Float
  }

  extend type Query {
    items: [Item!]!
    item(id: ID!): Item
  }

  extend type Mutation {
    createItem(data: ItemCreateInput!): Item!
    updateItem(id: ID!, data: ItemUpdateInput!): Item!
    deleteItem(id: ID!): Item!
  }
`;
