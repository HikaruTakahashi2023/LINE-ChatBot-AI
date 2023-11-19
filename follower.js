"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connection_mdc = require("../modules/operate-db").connection_mdc;
const post_slack_error = require("../modules/operate-slack").postSlackError;

class Follower {
  constructor(user_id) {
    this.connection = connection_mdc;
    this.user_id = user_id;
  }

  async existUserId() {
    return new Promise((resolve, reject) => {
      this.connection.query(
        `
        SELECT 
          *
        FROM 
          follower
        WHERE 
          USER_ID = '${this.user_id}';
      `,
        (e, results) => {
          if (e) {
            post_slack_error(e + e.stack, "Follower record length err");
            reject(e + e.stack);
          } else {
            resolve(results.length > 0);
          }
        }
      );
    });
  }
}

module.exports = {
  Follower: Follower,
};
