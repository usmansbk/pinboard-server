import MutationError from "~utils/errors/MutationError";
import { WELCOME_EXISTING_USER } from "~helpers/constants/i18n";
import { BadRequest, Ok } from "~helpers/response";

export default {
  Mutation: {
    async loginWithEmail(_, { input }, { dataSources, jwt, t, redis }) {
      try {
        const { id, firstName, language } =
          await dataSources.users.findByEmailAndPassword(input);

        const { accessToken, refreshToken, tokenId, exp } =
          await jwt.generateAuthTokens({
            id,
            language,
          });
        await redis.setex(tokenId, exp, refreshToken);

        return Ok({
          message: t(WELCOME_EXISTING_USER, { firstName }),
          accessToken,
          refreshToken,
        });
      } catch (e) {
        if (e instanceof MutationError) {
          return BadRequest({
            message: t(e.message),
          });
        }
        throw e;
      }
    },
  },
};