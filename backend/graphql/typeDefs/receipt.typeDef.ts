import { gql } from "graphql-tag";

export const receiptTypeDef = gql`
scalar Upload
  type Receipt {
    id: ID!
    storeName: String
    purchaseDate: String
    totalAmount: Float
    items: [Item!]!          
    imageUrl: String
    createdAt: String
  }

  type ReceiptInfo {
    purchaseDate: String
    storeName: String
  }
  
   type ProcessedReceipt {
    items: [Item!]!
    totalPrice: Float
    receipt: ReceiptInfo
  }

  type UploadResponse {
    message: String
    data: ProcessedReceipt
  }

  # Query to get all receipts
  extend type Query {
    receipts: [Receipt!]!
    receipt(id: ID!): Receipt
  }

  # Mutations to create receipts
  extend type Mutation {
    createReceipt(
      storeName: String
      purchaseDate: String
      totalAmount: Float
      imageUrl: String
    ): Receipt!

    uploadAndProcess(file: Upload!): UploadResponse!
  }
`;
