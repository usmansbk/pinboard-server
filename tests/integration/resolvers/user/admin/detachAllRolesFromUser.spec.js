import { gql } from "apollo-server-express";
import createApolloTestServer from "tests/mocks/apolloServer";
import FactoryBot from "tests/factories";
import cache from "~utils/cache";
import { PERMISSIONS_KEY_PREFIX } from "~constants/auth";

const query = gql`
  mutation DetachAllRolesFromUser($userId: ID!) {
    detachAllRolesFromUser(userId: $userId) {
      code
      message
      user {
        roles {
          id
        }
      }
    }
  }
`;

describe("Mutation.detachAllRolesFromUser", () => {
  let server;
  beforeAll(() => {
    server = createApolloTestServer();
  });

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(async () => {
    await FactoryBot.truncate();
  });

  describe("admin", () => {
    let admin;
    beforeEach(async () => {
      admin = await FactoryBot.create("user", {
        include: {
          roles: {
            name: "admin",
          },
        },
      });
    });

    test("should detach all roles from user", async () => {
      const other = await FactoryBot.create("user", {
        include: {
          roles: {
            name: "staff",
          },
        },
      });

      const res = await server.executeOperation(
        {
          query,
          variables: {
            userId: other.id,
          },
        },
        { currentUser: admin }
      );

      expect(res.data.detachAllRolesFromUser.user.roles).toHaveLength(0);
    });

    test("should invalidate cached permissions", async () => {
      const other = await FactoryBot.create("user");
      const role = await FactoryBot.create("role", {
        name: "staff",
      });

      const key = `${PERMISSIONS_KEY_PREFIX}:${other.id}`;
      await cache.set({
        key,
        value: "mockPermissions",
        expiresIn: 10000,
      });

      await server.executeOperation(
        {
          query,
          variables: {
            userId: other.id,
            roleIds: [role.id],
          },
        },
        { currentUser: admin }
      );

      const cachedPermissions = await cache.get(key);

      expect(cachedPermissions).toBe(null);
    });
  });
});