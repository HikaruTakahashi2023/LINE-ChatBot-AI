"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const axios = require("axios");
const LINE_PUSH_MESSAGE_ENDPOINT = process.env.LINE_PUSH_MESSAGE_ENDPOINT;

function sendPushMessage(access_token, user_id, message) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${access_token}`,
  };
  const push_message_body = JSON.stringify({
    to: user_id,
    messages: [
      {
        type: "text",
        text: message,
      },
    ],
  });

  axios.post(LINE_PUSH_MESSAGE_ENDPOINT, push_message_body, {
    headers,
  });
  console.log("Push message sent successfully");
}

exports.sendPushMessage = sendPushMessage;
