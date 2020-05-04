"use strict";
const winston = require("winston");
const config = require("config");
require("express-async-errors");

process.on("unhandledRejection", (ex) => {
  throw ex;
});

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(i => `${i.timestamp} | ${i.message} ${i.stack ? "\n" + i.stack : ""}`)
  ),
  level: "info",
  // format: winston.format.json(),
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    new winston.transports.File({ filename: "./logs/error.log", json: false, level: "error" }),
    new winston.transports.File({ filename: "./logs/combined.log", json: false })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: "./logs/exceptions.log", json: false }),
    new winston.transports.File({ filename: "./logs/combined.log", json: false }),
  ],
  handleExceptions: true,
});

const consoleFormat = winston.format.printf(function(info) {
  return `${info.timestamp} - ${info.level}: ${JSON.stringify(info.message, null, 4)}`;
});

//
// If not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
if (config.get("env") === "development") {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }), consoleFormat),
    level: "debug",
    handleExceptions: true,
    colorize: true,
    prettyPrint: true
  }));
}

module.exports = logger;