import http from "http";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express from "express";
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';

import app from "./app";

import { typeDefs, resolvers } from "./graphql/schema";

dotenv.config();

const prisma = new PrismaClient();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // csrfPrevention: false, // We'll handle security via CORS + upload preflight
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

async function startApolloServer() {
  await server.start();
  console.log("Apollo Server started");
  
  app.use(
    "/graphql",
    cors<cors.CorsRequest>({
      origin: "http://localhost:3000",
      credentials: true,
    }),
    express.json(),
    graphqlUploadExpress({
      maxFileSize: 10000000,
      maxFiles: 1,
    }),
    expressMiddleware(server, {
      context: async () => ({ prisma }),
    })
  );

  const PORT = process.env.PORT || 5000;


  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, resolve)
  );

  console.log(`Server is running on http://localhost:${PORT}`);
}

startApolloServer();
