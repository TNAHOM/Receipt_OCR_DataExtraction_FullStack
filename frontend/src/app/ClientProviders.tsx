"use client";

import { ReactNode } from "react";
import { ApolloProvider } from "@apollo/client";
import { client } from "./lib/apolloClient";

interface Props { children: ReactNode }

export function ClientProviders({ children }: Props) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
