const express = require("express");
const env = require("dotenv");
const rateLimiter = require("./utils/rateLimiter");
const config = require("./config");
const pg = require("pg");

// Configurations
env.config();
const app = express();
app.use(express.json()); 
app.use(rateLimiter);
const basePath = config.server.basePath; 
config.pool = new pg.Pool(config.database);

const txtRoutes = require("./routes/txt");
const authRoutes = require("./routes/auth");

app.use(basePath +"/v1/api/txt", txtRoutes);
app.use(basePath +"/v1/api/auth", authRoutes);

app.listen(config.server.port, () => {
    console.log("Express.js started");
});
