"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connection_mdc = require("../modules/operate-db").connection_mdc;
const post_slack_error = require("../modules/operate-slack").postSlackError;

class GptMessages {
  constructor(user_id) {
    this.connection = connection_mdc;
    this.user_id = user_id;
  }

  async fetch() {
    return new Promise((resolve, reject) => {
      this.connection.query(
        `SELECT CONVERSATION FROM GPT_MESSAGES WHERE USER_ID = '${this.user_id}';`,
        (e, results) => {
          if (e) {
            post_slack_error(e + e.stack, "GptMessages.fetch");
            reject(e + e.stack);
          }
          let conversation_column = [];
          let fort_conversations_ago_time = 958973600000;
          if (results.length <= 0) {
            this.connection.query(`
              INSERT INTO GPT_MESSAGES (USER_ID, CONVERSATION) VALUES ('${this.user_id}', '[]')
            `);
          } else {
            const conversation_column_all = JSON.parse(results[0].CONVERSATION);
            if (conversation_column_all.length > 4) {
              conversation_column = conversation_column_all.slice(-4);
            } else {
              conversation_column = conversation_column_all;
            }

            // 20回前のリクエストtime取得(連投対策用)
            if (conversation_column_all.length >= 40) {
              fort_conversations_ago_time =
                conversation_column_all[conversation_column_all.length - 40]
                  .time;
            }
          }
          // 過去の会話履歴としてrole,contentのみ抽出
          const history = conversation_column.map((item) => {
            const { role, content } = item;
            return { role, content };
          });
          const return_data = {
            history: history,
            fort_conversations_ago_time: fort_conversations_ago_time,
          };
          resolve(return_data);
        }
      );
    });
  }

  async insert(user_conversation, gpt_conversation) {
    return new Promise((resolve, reject) => {
      this.connection.query(
        `
        UPDATE 
          GPT_MESSAGES
        SET 
          CONVERSATION = JSON_ARRAY_APPEND(
            CONVERSATION, '$', CAST('${JSON.stringify(
              user_conversation
            )}' AS JSON)
          ),
          CONVERSATION = JSON_ARRAY_APPEND(
            CONVERSATION, '$', CAST('${JSON.stringify(
              gpt_conversation
            )}' AS JSON)
          )
        WHERE 
          USER_ID = '${this.user_id}';
      `,
        (e, results) => {
          if (e) {
            post_slack_error(e + e.stack, "GptMessages.insert");
            reject(e + e.stack);
            console.log(e);
          } else {
            resolve(results);
          }
        }
      );
    });
  }
}

module.exports = {
  GptMessages: GptMessages,
};
