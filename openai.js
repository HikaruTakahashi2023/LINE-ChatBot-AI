"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const post_slack_error = require("../modules/operate-slack").postSlackError;

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

class OpenAi {
  constructor(user_info) {
    this.openai = new OpenAIApi(configuration);
    this.user_info = user_info;
  }

  async askChatGpt(all_prompt) {
    try {
      const completion = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: all_prompt,
        max_tokens: 512,
      });
      return completion.data.choices[0].message.content;
    } catch (error) {
      post_slack_error(e + e.stack, "openai error");
    }
  }

  getSystemPrompt() {
    let system_prompt = `  
    ###Prererequisite###.
    
    ###Constraints###.

    ###Code of Conduct ####.
    
    ###例###
    以下に会話の例を示します
  
    <質問予測>

    `;

    if (this.user_info) {
      const user_name = this.user_info.name || "未設定";
      const user_height = this.user_info.height || "未設定";
      const user_weight = this.user_info.weight || "未設定";
      const user_birthday = this.user_info.birthday || "未設定";
      const user_sex = this.user_info.sex || "未設定";

      system_prompt += `
        ###ユーザー情報###
        名前：${user_name}
        身長：${user_height}
        体重：${user_weight}
        生年月日：${user_birthday}
        性別：${user_sex}
      `;
    }

    return system_prompt;
  }
}

module.exports = {
  OpenAi: OpenAi,
};
