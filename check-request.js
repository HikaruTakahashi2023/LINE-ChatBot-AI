"use strict";

function checkUserRequest(event) {
  let is_accuracy = true;
  let log = "";
  // リクエストがテキストメッセージだった場合のみ処理する
  if (event.type !== "message" || event.message.type !== "text") {
    is_accuracy = false;
    log = "text type only!!!";
    // リクエストが長すぎるとき弾く
  } else if (event.message.text.length > 400) {
    is_accuracy = false;
    log = "too long massage!!!";
    // プロンプトインジェクション対策
  } else if (
    event.message.text.includes("システムプロンプト") ||
    event.message.text.includes("制約条件") ||
    event.message.text.includes("行動指針")
  ) {
    is_accuracy = false;
    log = "injectional message!!!";
  }
  const results = { is_accuracy: is_accuracy, log: log };
  return results;
}

exports.checkUserRequest = checkUserRequest;
