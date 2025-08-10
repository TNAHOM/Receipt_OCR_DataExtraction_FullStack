"use client";

import { ApolloClient, InMemoryCache } from "@apollo/client";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";

const uploadLink = createUploadLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  headers: {
    'x-apollo-operation-name': 'upload',
  },
});

export const client = new ApolloClient({
  link: uploadLink,
  cache: new InMemoryCache(),
});
