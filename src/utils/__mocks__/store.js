import redis from "redis-mock";

const client = redis.createClient();

const set = ({ key, value, expiresIn }) => client.setex(key, expiresIn, value);

const get = (key) => client.get(key);

const remove = (key) => client.del(key);

const increment = (key) => client.incr(key);

export default {
  set,
  get,
  remove,
  increment,
};