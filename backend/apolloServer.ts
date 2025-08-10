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
  
  // This is where you configure the middleware for the /graphql endpoint
  app.use(
    "/graphql",
    // The order of middleware is VERY important!
    // 1. CORS
    cors<cors.CorsRequest>({
      origin: "http://localhost:3000", // Be specific for credentials to work
      credentials: true,
    }),
    // 2. Body parsing (for regular JSON requests)
    express.json(),
    // 3. The graphql-upload middleware
    graphqlUploadExpress({
      maxFileSize: 10000000, // 10 MB
      maxFiles: 1,
    }),
    // 4. The Apollo Server middleware
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
