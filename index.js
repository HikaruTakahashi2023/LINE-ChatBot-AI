"use strict";

// .env利用する
require("dotenv").config();

// 暗号化で使うモジュール
const crypto = require("crypto");
const express = require("express");
const line = require("@line/bot-sdk");
const follower = require("./model/follower").Follower;
const gpt_messages = require("./model/gpt-messages").GptMessages;
const user_mst = require("./model/user-mst").UserMst;
const open_ai = require("./modules/openai").OpenAi;
const post_slack_error = require("./modules/operate-slack").postSlackError;
const message_object = require("./modules/make-message").messageObject;
const check_user_request = require("./modules/check-request").checkUserRequest;
const send_push_message = require("./modules/send-pushmessage").sendPushMessage;
const introduce_medicat = require("./modules/richmenu-env").introduce_medicat;

const app = express();
const PORT = process.env.PORT || 3000;

// 環境変数の読み込み
const API_PW = process.env.API_PW;
const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

// 服用管理アプリリマインドメッセージで使うpushmessage
// "headers": {"Content-Type": "application/json","pass":"*****"},"body": {id:"userId",msg:"message"}
app.post("/api/v1/push", async (req, res) => {
  try {
    const pw = req.headers.pass;
    if (pw == API_PW) {
      const user_id = req.body.id;
      const fb_message_for_sent_medication_record = req.body.msg;
      await send_push_message(
        config.LINE_CHANNEL_ACCESS_TOKEN,
        user_id,
        fb_message_for_sent_medication_record
      );
      return;
    }
  } catch (e) {
    post_slack_error(e + e.stack, "pushmessage_error");
  }
});

// LINEApiからwebhookを受け取った時の操作
app.post("/webhook", line.middleware(config), (req, res) => {
  (async () => {
    try {
      // 不正リクエスト防止 start //

      // 署名の検証
      const x_line_signature =
        req.headers["x-line-signature"] || req.headers["X-Line-Signature"];
      const body = JSON.stringify(req.body);
      const signature = crypto
        .createHmac("SHA256", config.channelSecret)
        .update(body)
        .digest("base64");
      if (x_line_signature != signature) {
        console.log("x_line_signature");
        res.status(400).end();
        return;
      }

      const user_id = req.body.events[0].source.userId;
      const gpt_messages_ins = new gpt_messages(user_id);
      const conversation_column = await gpt_messages_ins.fetch();

      // 連投対策（5分で20会話まで)
      const current_time = new Date().getTime();
      const fort_conversations_ago_time =
        conversation_column.fort_conversations_ago_time;
      if (current_time - fort_conversations_ago_time < 300000) {
        //5分は300000ミリ秒
        console.log("massive messages!!!");
        res.status(400).end();
        return;
      }

      const event = req.body.events[0];
      // ユーザーリクエスト内容の正当性
      const check_results = check_user_request(event);
      if (!check_results.is_accuracy) {
        console.log(check_results.log);
        res.status(400).end();
        return;
      }

      const follower_ins = new follower(user_id);
      // user_idが会員のものでない場合はリクエスト防止
      if (!(await follower_ins.existUserId())) {
        console.log("User id does not exist in follower table!!!");
        res.status(400).end();
        return;
      }
      // 不正リクエスト防止 end //

      const client = new line.Client(config);
      // リッチメニューのメディにゃんの使い方
      if (event.message.text == introduce_medicat.trigger) {
        await client.replyMessage(
          event.replyToken,
          message_object(introduce_medicat.explaination)
        );
        return;
      }

      const user_mst_ins = new user_mst(user_id);
      const user_info = await user_mst_ins.fetch();

      const open_ai_ins = new open_ai(user_info);
      // system_promptを取得
      const system_prompt = open_ai_ins.getSystemPrompt();

      // 過去の会話履歴を取得（ここでuserIdすでにいるかと、過去の会話履歴の取得制限も同時に行う)
      const history = conversation_column.history;

      // 新しいメッセージを取得
      const line_message = event.message.text;

      // プロンプト設計開始
      // ①過去の会話履歴を追加
      const all_prompt = history;
      // ②systempromptを追加
      all_prompt.unshift({ role: "system", content: system_prompt });
      // ③新しいメッセージを追加
      all_prompt.push({ role: "user", content: line_message });

      // GPTに投げて、返答を取得
      const return_message = await open_ai_ins.askChatGpt(all_prompt);

      // ユーザーにgptからのメッセージを返す
      await client.replyMessage(
        event.replyToken,
        message_object(return_message)
      );

      // 会話履歴としてデータベースに格納(timeは連投対策用)
      const escaped_line_message = line_message.replace(/\n/g, "\\n");
      const escaped_return_message = return_message.replace(/\n/g, "\\n");
      const user_conversation = {
        role: "user",
        content: escaped_line_message,
        time: current_time,
      };
      const gpt_conversation = {
        role: "assistant",
        content: escaped_return_message,
        time: current_time,
      };
      gpt_messages_ins
        .insert(user_conversation, gpt_conversation)
        .catch((e) => {
          post_slack_error(e + e.stack, "gpt_messages.insert");
        });

      return;
    } catch (e) {
      post_slack_error(e + e.stack, "Internal Server Error");
      res.status(500).send("Internal Server Error");
      console.log(e + e.stack);
    }
  })();
});

app.listen(PORT);
console.log(`Server running at ${PORT}`);
