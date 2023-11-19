"use strict";

function messageObject(return_message) {
  let message_object = {};
  const cutting_point = return_message.indexOf("<質問予測>");

  // 質問予測でてこなかったら
  if (cutting_point === -1) {
    message_object = {
      type: "text",
      text: return_message,
    };
    return message_object;
  }

  // 返答と質問予測の分離
  const answer_message = return_message.substring(0, cutting_point - 2);
  const question_predictions = return_message.substring(cutting_point);
  // 三つの質問予測を改行を境に切り出し
  const question_predictions_obj = question_predictions.split(/\n/);

  // 質問予測の数だけクイックリプライを生成
  let quickreply_items = [];
  for (let i = 1; i < question_predictions_obj.length; i++) {
    // 質問予測が20文字を超えてる場合
    if (question_predictions_obj[i].length < 20) {
      quickreply_items.push({
        type: "action",
        action: {
          type: "message",
          label: question_predictions_obj[i],
          text: question_predictions_obj[i],
        },
      });
    }
  }
  if (quickreply_items == []) {
    message_object = {
      type: "text",
      text: answer_message,
    };
    return message_object;
  }

  // 質問予測を含んだメッセージオブジェクト
  message_object = {
    type: "text",
    text: answer_message,
    quickReply: {
      items: quickreply_items,
    },
  };

  return message_object;
}

exports.messageObject = messageObject;
