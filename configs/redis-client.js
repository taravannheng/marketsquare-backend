const redis = require("redis");

const redisClient = redis.createClient({
  url: process.env.REDIS_CONNECTION_STRING
});

const connectToRedis = async () => {
  await redisClient.connect();
}

module.exports = { connectToRedis, redisClient };