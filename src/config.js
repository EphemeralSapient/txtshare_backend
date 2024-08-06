require("dotenv").config();
const redis = require("ioredis");
const pg = require("pg");


module.exports =  {
    // Server configuration
    server: {
        port: process.env.PORT || 4321,
        basePath : process.env.BASE_PATH || ""
    },

    // PostgreSQL Database configuration
    pool : new pg.Pool({
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        port: process.env.POSTGRES_PORT || 5432
    }),

    // Redis configuration
    redis: new redis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASS || ""
    }),

    // Time limit configuration
    expireLimit : new Set([
        "once",
        "hour",
        "day",
        "week",
        "month",
        "year"
    ]),

    // Rate limiting configuration
    rateLimit: {
        maxRequests: process.env.RATELIMIT_REQUESTS || 60, // Max requests per minute
        cleanupInterval: 60 * 60 * 1000 // Cleanup interval in milliseconds
    },

    // OAuth 2.0 Credentials
    oauth: {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI
    },

    // // Bloom Filters
    // urlBloom: bf.create(1000000, 0.01),
    // usernameBloom: bf.create(1000000, 0.01),

    // Security settings
    security: {
        jwtToken : process.env.JWT_SECRET,
        allowedMimeTypes: [
            "application/json"
        ],
        disallowedMimeTypes: new Set([
            "application/octet-stream",
            "application/pdf",
            "application/zip",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]),
        maxTxtSizeKb: process.env.MAX_TXT_SIZE_KB || 1024 * 6 // Max file size in KB
    }
};