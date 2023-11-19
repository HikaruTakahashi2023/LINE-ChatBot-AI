"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const fs = require("fs");
const mysql = require("mysql");

const DBUSER = process.env.DB_USER;
const DBPASS = process.env.DB_PASS;
const DBHOST = process.env.DB_HOST;

const DB_NAME_MDC = process.env.DB_NAME_MDC;
const DB_NAME_USERMANAGE = process.env.DB_NAME_USERMANAGE;

const SERVERKEY = process.env.DB_KEY_SERVER;
const CLIENTKEY = process.env.DB_KEY_CLIENTKEY;
const CLIENTCERT = process.env.DB_KEY_CLIENTCERT;

const connection_mdc = mysql.createConnection({
  host: DBHOST,
  user: DBUSER,
  password: DBPASS,
  database: DB_NAME_MDC,
  charset: "utf8mb4",
  ssl: {
    ca: fs.readFileSync(SERVERKEY),
    key: fs.readFileSync(CLIENTKEY),
    cert: fs.readFileSync(CLIENTCERT),
  },
});

const connection_usermanage = mysql.createConnection({
  host: DBHOST,
  user: DBUSER,
  password: DBPASS,
  database: DB_NAME_USERMANAGE,
  charset: "utf8mb4",
  ssl: {
    ca: fs.readFileSync(SERVERKEY),
    key: fs.readFileSync(CLIENTKEY),
    cert: fs.readFileSync(CLIENTCERT),
  },
});

exports.connection_mdc = connection_mdc;
exports.connection_usermanage = connection_usermanage;
