import { Model } from "sequelize";
import bcrypt from "bcrypt";
import {
  FIRST_NAME_EMPTY,
  FIRST_NAME_REQUIRED,
  FIRST_NAME_LEN,
  LAST_NAME_LEN,
  LAST_NAME_REQUIRED,
  LAST_NAME_EMPTY,
  EMAIL_UNAVAILABLE,
  INVALID_EMAIL,
  PHONE_NUMBER_UNAVAILABLE,
  INVALID_PHONE_NUMBER,
  PASSWORD_LEN,
  INVALID_PASSWORD,
  INVALID_LOCALE,
  INVALID_URL,
  USERNAME_NAME_LEN,
} from "~helpers/constants/i18n";
import { AVATAR_ALIAS } from "~helpers/constants/models";

export default (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.belongsTo(models.File, {
        as: AVATAR_ALIAS,
        foreignKey: "avatarId",
      });
    }

    checkPassword(password) {
      return bcrypt.compare(password, this.password);
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        validate: {
          isUUID: 4,
        },
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [2, 100],
            msg: FIRST_NAME_LEN,
          },
          notNull: {
            msg: FIRST_NAME_REQUIRED,
          },
          notEmpty: {
            msg: FIRST_NAME_EMPTY,
          },
        },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [2, 100],
            msg: LAST_NAME_LEN,
          },
          notNull: {
            msg: LAST_NAME_REQUIRED,
          },
          notEmpty: {
            msg: LAST_NAME_EMPTY,
          },
        },
      },
      fullName: {
        type: DataTypes.VIRTUAL,
        get() {
          return [this.firstName, this.lastName].join(" ");
        },
        set() {
          throw new Error("Do not try to set the `fullName` value!");
        },
      },
      userName: {
        type: DataTypes.STRING,
        validate: {
          len: {
            args: [2, 100],
            msg: USERNAME_NAME_LEN,
          },
          notEmpty: {
            msg: USERNAME_NAME_LEN,
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: EMAIL_UNAVAILABLE,
        },
        validate: {
          isEmail: {
            msg: INVALID_EMAIL,
          },
          notNull: {
            msg: INVALID_EMAIL,
          },
        },
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      phoneNumberVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        unique: {
          msg: PHONE_NUMBER_UNAVAILABLE,
        },
        validate: {
          notEmpty: {
            msg: INVALID_PHONE_NUMBER,
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [6, 64],
            msg: PASSWORD_LEN,
          },
          notEmpty: {
            msg: INVALID_PASSWORD,
          },
          notNull: {
            msg: INVALID_PASSWORD,
          },
        },
      },
      language: {
        type: DataTypes.STRING,
        defaultValue: "en",
        validate: {
          isAlpha: {
            msg: INVALID_LOCALE,
          },
        },
      },
      socialAvatarURL: {
        type: DataTypes.TEXT,
        validate: {
          isUrl: {
            msg: INVALID_URL,
          },
        },
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );

  const hashPassword = async (user) => {
    if (user.changed("password")) {
      const plainPassword = user.getDataValue("password");
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      user.setDataValue("password", hashedPassword);
    }
  };

  User.beforeCreate("hash password", hashPassword);
  User.beforeUpdate("hash password", hashPassword);
  User.beforeUpdate("unverify new phone number", (user) => {
    if (user.changed("phoneNumber")) {
      user.setDataValue("phoneNumberVerified", false);
    }
  });
  return User;
};
