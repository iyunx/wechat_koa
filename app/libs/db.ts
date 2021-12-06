import { Sequelize } from 'sequelize';
import config from '../../config';
import logger from "../../log";

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  username: config.db.username,
  password: config.db.password,
  logging: msg => logger.info(msg),
  define: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  },
  // 格式化时间，获取当前日期
  dialectOptions: {
    dateStrings: true,
    typeCast: true
  },
  // 存储当前日期
  timezone: '+08:00'
})

export default sequelize