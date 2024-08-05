
// Delete all cache in redis for every x periodls 
const config = require("../config");
const redis = config.redis

function redisCleanup() {
    redis.flushall();
    console.log("Redis cache flushed");
}

setInterval(redisCleanup, config.rateLimit.cleanupInterval);
