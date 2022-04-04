import { Op } from "sequelize";

const CONDITIONALS = {
  and: "and",
  or: "or",
};

const buildComparison = (operation) => {
  const query = {};
  Object.keys(operation).forEach((operator) => {
    query[Op[operator]] = operation[operator];
  });
  return query;
};

export const buildWhereQuery = (where) => {
  if (!where) {
    return undefined;
  }

  const query = {};
  Object.keys(where).forEach((attribute) => {
    const value = where[attribute];

    if (attribute === CONDITIONALS.and || attribute === CONDITIONALS.or) {
      query[Op[attribute]] = value.map(buildWhereQuery);
    } else {
      query[attribute] = buildComparison(value);
    }
  });

  return query;
};

const buildFilterQuery = ({ where }) => ({
  where: buildWhereQuery(where),
});

export default buildFilterQuery;
