import { gql } from "@apollo/client";

export const GET_RECEIPTS = gql`
  query GetReceipts {
    receipts {
      id
      storeName
      purchaseDate
      totalAmount
      imageUrl
      createdAt
      items {
        id
        name
        quantity
        price
        lineTotal
      }
    }
  }
`;

export const GET_ITEMS = gql`
  query GetItems {
    items {
      id
      name
      quantity
      price
      lineTotal
      receiptId
    }
  }
`;
