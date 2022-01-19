import links from "~helpers/links";

export default {
  User: {
    async picture(parent, { resize }, { dataSources }) {
      const avatar = await dataSources.files.findByPk(parent.avatarId);

      if (avatar) {
        let imageRequest = avatar.toJSON();

        if (resize) {
          imageRequest = {
            ...imageRequest,
            edits: {
              resize,
            },
          };
        }
        const size = Math.max(32, resize.thumbnailSize);
        const thumbnailRequest = {
          ...imageRequest,
          edits: {
            resize: {
              width: size,
              height: size,
            },
          },
        };
        return {
          url: links.imageUrl(imageRequest),
          thumbnail: links.imageUrl(thumbnailRequest),
        };
      }

      if (parent.socialAvatarURL) {
        return {
          url: parent.socialAvatarURL,
          thumbnail: parent.socialAvatarURL,
        };
      }

      return null;
    },
    isOwner(parent, _args, { tokenInfo }) {
      return parent.id === tokenInfo?.sub;
    },
  },
};
