/**
 * Based on "MySQL cursor based pagination with multiple columns"
 * https://stackoverflow.com/questions/38017054/mysql-cursor-based-pagination-with-multiple-columns/38017813
 */

import btoa from "btoa";
import atob from "atob";
import { Op } from "sequelize";

export const createCursor = (order, next) =>
  btoa(JSON.stringify(order.map(({ field }) => next[field])));

export const parseCursor = (cursor) => JSON.parse(atob(cursor));

const DEFAULT_DIRECTION = "ASC";
const PRIMARY_KEY_FIELD = "id";
const UNIQUE_FIELDS = [PRIMARY_KEY_FIELD, "email", "username", "createdAt"];

export const ensureDeterministicOrder = (order) => {
  const hasUniqueField = order.find(({ field }) =>
    UNIQUE_FIELDS.includes(field)
  );

  if (hasUniqueField) {
    return order;
  }
  return [...order, { field: PRIMARY_KEY_FIELD, sort: DEFAULT_DIRECTION }];
};

export const reverseOrder = (order) =>
  order.map(({ field, sort }) => ({
    field,
    sort: sort === "DESC" ? "ASC" : "DESC",
  }));

const buildPaginationQuery = (order = [], cursor = []) => {
  const [{ field, sort }] = order;
  const operation = sort === DEFAULT_DIRECTION ? Op.gt : Op.lt;
  const [value] = cursor;

  if (order.length === 1) {
    return {
      [field]: {
        [operation]: value,
      },
    };
  }
  return {
    [Op.or]: [
      {
        [field]: {
          [operation]: value,
        },
      },
      {
        [field]: value,
        ...buildPaginationQuery(order.slice(1), cursor.slice(1)),
      },
    ],
  };
};

export const getPaginationQuery = (order, cursor) => {
  if (order?.length !== cursor?.length) {
    return null;
  }

  return buildPaginationQuery(order, cursor);
};
