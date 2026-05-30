const redis = require("../utils/cache");
const urlRepository = require("../repositories/url.repository");

async function flushCounters() {
  let cursor = "0";
  do {
    const [newCursor, keys] = await redis.scan(cursor, {
      MATCH: "clicks:*",
      COUNT: 100,
    });

    cursor = newCursor;

    for (const key of keys) {
      const shortId = key.split(":")[1];
      const count = await redis.get(key);

      if (count) {
        await urlRepository.incrementClicks(shortId, parseInt(count));
        await redis.del(key);
      }
    }
  } while (cursor !== "0");
}

setInterval(flushCounters, 30000); // every 30 sec
