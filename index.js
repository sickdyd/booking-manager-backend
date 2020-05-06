"use strict";
const express = require("express");
const app = express();
const config = require("config");
const cors = require("cors");
// The function below creates a default admin user
// email: "test@gmail.com", password: "testing123"
require("./utilities/createUser")();

app.use(cors());
app.use(express.urlencoded({ extended: true }));

const logger = require("./startup/logging");
require("./startup/console")(app);
require("./startup/database")();
require("./startup/routes")(app);
require("./startup/prod")(app);

logger.info(config.get("name"));

let port = process.env.PORT || config.get("port") || 3334;
if (process.env.NODE_ENV === "test") port = "1234";
const server = app.listen(port, () => logger.info(`Listening on port ${port}.`));

module.exports = server;