"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const slack_webhook_url = process.env.SLACK_WEBHOOK;
const channel_id = process.env.SLACK_ERROR_CHANNEL;
const bot_user_name = process.env.SLACK_BOT_NAME;

const https = require("https");

function postSlackError(error_message, error_pretext) {
  const payload = {
    channel: channel_id,
    username: bot_user_name,
    attachments: [
      {
        pretext: error_pretext,
        color: "#FF0000",
        text: error_message,
        mrkdwn_in: ["text", "pretext"],
      },
    ],
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const req = https.request(slack_webhook_url, options, (res) => {
    res.on("data", (d) => {
      process.stdout.write(d);
    });
  });

  req.on("error", (error) => {
    console.error(error);
  });

  req.write(JSON.stringify(payload));
  req.end();
}

exports.postSlackError = postSlackError;
