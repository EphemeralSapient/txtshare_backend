require("dotenv").config();

module.exports =  {
    // Server configuration
    server: {
        port: process.env.PORT || 4321,
        basePath : process.env.BASE_PATH || ""
    },

    // PostgreSQL Database configuration
    database: {
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDB,
        password: process.env.PGPASS,
        port: process.env.PGPORT || 5432,
    },

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