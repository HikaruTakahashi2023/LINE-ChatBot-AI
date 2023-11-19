"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connection_usermanage =
  require("../modules/operate-db").connection_usermanage;
const post_slack_error = require("../modules/operate-slack").postSlackError;

class UserMst {
  constructor(user_id) {
    this.connection = connection_usermanage;
    this.user_id = user_id;
  }

  async fetch() {
    return new Promise((resolve, reject) => {
      this.connection.query(
        `
        SELECT 
          u.USER_NAME as name, 
          JSON_EXTRACT(i.CONTENT,'$.userheight') as userheight, 
          JSON_EXTRACT(i.CONTENT,'$.userweight') as userweight, 
          JSON_EXTRACT(i.CONTENT,'$.birthday') as birthday, 
          JSON_EXTRACT(i.CONTENT,'$.sex') as sex, 
          m.MEDICINE, 
          t.START_AT
        FROM 
          USER_MST as u
        LEFT OUTER JOIN 
          INTERVIEW_TRA as i 
        ON 
          u.USER_ID = i.USER_ID
        LEFT OUTER JOIN 
          TREATMENT_TRA as t 
        ON 
          t.INTERVIEW_ID = i.INTERVIEW_ID
        LEFT OUTER JOIN 
          MEDICINE_MST as m 
        ON 
          m.MEDICINE_ID = t.MEDICINE_ID
        WHERE 
          u.LINE_ID = '${this.user_id}';
        `,
        (e, results) => {
          if (e) {
            post_slack_error(e + e.stack, "UserMst.fetch");
            reject(e + e.stack);
          } else {
            let user_info = {};
            if (results.length > 0) {
              const row = results[0];
              user_info = {
                name: row.name,
                userheight: row.userheight,
                userweight: row.userweight,
                birthday: row.birthday,
                sex: row.sex,
                MEDICINE: row.MEDICINE,
                START_AT: row.START_AT,
              };
            }
            resolve(user_info);
          }
        }
      );
    });
  }
}

module.exports = {
  UserMst: UserMst,
};
