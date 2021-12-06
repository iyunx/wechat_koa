import { configure, getLogger } from "log4js";

configure({
  appenders: {
    cheese: { type: 'file', filename: 'log/logger/cheese.log'},
    db: { type: 'file', filename: 'log/logger/db.log'},
  },
  categories: {
    default: { appenders: ["cheese"], level: "error" },
    db: { appenders: ["db"], level: "info" },
  }
})

const dbLog = getLogger('db')

export{
  dbLog
}
export default getLogger()