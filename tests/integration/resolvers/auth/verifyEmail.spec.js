import { gql } from "apollo-server-express";
import createApolloTestServer from "tests/mocks/apolloServer";
import FactoryBot from "tests/factories";
import store from "~utils/store";
import mailer from "~utils/mailer";
import jwt from "~utils/jwt";
import { EMAIL_VERIFICATION_KEY_PREFIX } from "~constants/auth";

const query = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      code
      message
      success
    }
  }
`;

jest.mock("~utils/mailer", () => {
  return {
    sendEmail: jest.fn(),
  };
});

describe("Mutation.verifyEmail", () => {
  let server;
  beforeAll(() => {
    server = createApolloTestServer();
  });

  afterAll(async () => {
    await server.stop();
  });

  test("should verify email and send welcome email", async () => {
    const user = await FactoryBot.create("user");
    const { token, exp } = jwt.generateToken({
      aud: process.env.WEB_CLIENT_ID,
      sub: user.id,
    });

    const key = `${EMAIL_VERIFICATION_KEY_PREFIX}:${user.id}`;
    await store.set({
      key,
      value: token,
      expiresIn: exp,
    });

    const res = await server.executeOperation({
      query,
      variables: {
        token,
      },
    });

    expect(mailer.sendEmail).toBeCalledTimes(1);
    expect(res.data.verifyEmail).toEqual({
      code: "EmailVerified",
      message: "EmailVerified",
      success: true,
    });
  });

  test("should fail for invalid tokens", async () => {
    const { errors } = await server.executeOperation({
      query,
      variables: {
        token: "invalid",
      },
    });
    expect(errors[0].message).toMatch("TokenInvalidError");
  });
});
