import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import http from "http";
import db from "~db/models";
import log from "~config/logger";
import i18n from "~config/i18n";
import createRedisServer from "~config/redis";
import * as jwt from "~utils/jwt";
import typeDefs from "./typeDefs";
import resolvers from "./resolvers";
import { UserDS } from "./datasources";

export const createApolloServer = (app) => {
  const httpServer = http.createServer(app);
  const redis = createRedisServer();
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    logger: log,
    dataSources: () => ({
      users: new UserDS(db.User),
    }),
    context: async ({ req }) => {
      let userInfo;
      const token = req.headers.authorization;

      if (token) {
        userInfo = jwt.verify(token);
      }

      const language = userInfo?.language || req.language || req.locale;

      return {
        jwt,
        redis,
        userInfo,
        t: i18n(language),
        locale: req.locale,
        clientId: req.headers.client_id,
      };
    },
  });
  return { server, httpServer };
};

const startApolloServer = async (app) => {
  const { server, httpServer } = createApolloServer(app);
  await server.start();
  server.applyMiddleware({ app });
  await new Promise((resolve) => {
    httpServer.listen({ port: 4000 }, resolve);
  });
  await db.sequelize.authenticate();
  await db.sequelize.sync({ force: true });

  return server;
};

export default startApolloServer;
