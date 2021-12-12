import faker from "faker";
import db from "~db/models";

const { User } = db;

const attributes = (attr = {}) => {
  const defaults = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    password: faker.internet.password(6),
    phoneNumber: faker.phone.phoneNumber(),
    locale: "en",
  };

  return Object.assign({}, defaults, attr);
};

const build = (attr) => User.build(attributes(attr));

const create = (attr) => User.create(attributes(attr));

const UserFactory = {
  build,
  create,
  attributes,
};

export default UserFactory;