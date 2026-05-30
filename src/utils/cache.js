const { redisClient } = require("../config/redis");

async function incr(key) {
  return redisClient.incr(key);
}

async function get(key) {
  return redisClient.get(key);
}

async function set(key, value, ttl) {
  const data = JSON.stringify(value);

  if (ttl) {
    return redisClient.set(key, data, { EX: ttl });
  }

  return redisClient.set(key, data);
}

async function expire(key, ttl) {
  return redisClient.expire(key, ttl);
}

async function del(key) {
  return redisClient.del(key);
}

async function setJson(key, value, ttl) {
  const str = JSON.stringify(value);
  if (ttl) return redisClient.set(key, str, { EX: ttl });
  return redisClient.set(key, str);
}

async function getJson(key) {
  const val = await redisClient.get(key);
  return val ? JSON.parse(val) : null;
}

async function incrBy(key, value) {
  return redisClient.incrBy(key, value);
}

async function scan(pattern, count = 100) {
  const keys = [];

  for await (const key of redisClient.scanIterator({
    MATCH: pattern,
    COUNT: count,
  })) {
    keys.push(key);
  }

  return keys;
}

async function mget(keys) {
  return redisClient.mGet(keys);
}

module.exports = {
  incr,
  get,
  set,
  expire,
  del,
  setJson,
  getJson,
  incrBy,
  scan,
  mget,
};
