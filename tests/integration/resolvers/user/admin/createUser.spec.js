import { gql } from "apollo-server-express";
import db from "~db/models";
import createApolloTestServer from "tests/mocks/apolloServer";
import attributes from "tests/attributes";
import store from "~utils/store";

const query = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      code
      message
      errors {
        field
        message
      }
      user {
        id
        email
      }
    }
  }
`;

describe("Mutation.createUser", () => {
  let server;
  beforeAll(() => {
    server = createApolloTestServer();
  });

  afterAll(async () => {
    await store.clearAll();
    await server.stop();
    await db.sequelize.close();
  });

  test("should allow admin to create user", async () => {
    const user = await db.User.create(attributes.user());
    const currentUser = await db.User.scope("permissions").findByPk(user.id);

    const input = attributes.user();
    const res = await server.executeOperation(
      {
        query,
        variables: {
          input,
        },
      },
      { currentUser }
    );
    expect(res.data.createUser.user.email).toBe(input.email);
  });

  test("should not allow non-admin to create user", async () => {
    const user = await db.User.create(attributes.user());
    const currentUser = await db.User.scope("permissions").findByPk(user.id);

    const input = attributes.user();
    const res = await server.executeOperation(
      {
        query,
        variables: {
          input,
        },
      },
      { currentUser }
    );
    expect(res.errors[0].message).toMatch("Unauthorized");
  });
});
