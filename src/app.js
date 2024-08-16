const express = require("express");
const env = require("dotenv");
const rateLimiter = require("./utils/rateLimiter");
const config = require("./config");
const pg = require("pg");

// Configurations
env.config();
const app = express();
app.use(express.json()); 
app.use(rateLimiter); // Rate limiter middleware
require("./utils/redisCleanup"); // Redis cleanup

// API base path ref
const basePath = config.server.basePath; 

const txtRoutes = require("./routes/txt");
const authRoutes = require("./routes/auth");
const accRoutes = require("./routes/account");

app.use(basePath +"/v1/api/txt", txtRoutes);
app.use(basePath +"/v1/api/auth", authRoutes);
app.use(basePath +"/v1/api/account", accRoutes);

app.get(basePath + "/ping" , (req, res) => {
    res.status(200).json({ message: "Pong!" });
});

app.listen(config.server.port, () => {
    console.log("Express.js started");
});
