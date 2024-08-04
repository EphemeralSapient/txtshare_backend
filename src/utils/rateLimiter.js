const rateLimit = {};
const config = require("../config");

module.exports = (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = new Date().getTime();

    if (ip in rateLimit) {
        if (now - rateLimit[ip][0] > 60 * 1000) {
            rateLimit[ip] = [now, 1];
        } else if (rateLimit[ip][1] >= (config.rateLimit.maxRequests)) {
            return res.status(429).json({ error: "Rate limit exceeded, try again after some time" });
        } else {
            rateLimit[ip][1]++;
        }
    } else {
        rateLimit[ip] = [now, 1];
    }
    next();
};

// Clean up rate limit data every hour or x milliseconds
setInterval(() => {
    const now = new Date().getTime();
    for (let ip in rateLimit) {
        if (now - rateLimit[ip][0] > 60 * 1000) {
            delete rateLimit[ip];
        }
    }
}, config.rateLimit.cleanupInterval);
