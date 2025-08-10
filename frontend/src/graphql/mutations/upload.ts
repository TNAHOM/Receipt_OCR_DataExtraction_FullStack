import { gql } from "@apollo/client";

export const UPLOAD_AND_PROCESS = gql`
  mutation UploadAndProcess($file: Upload!) {
    uploadAndProcess(file: $file) {
      message
      data {
        totalPrice
        items {
          name
          quantity
          price
        }
        receipt {
          purchaseDate
          storeName
        }
      }
    }
  }
`;
