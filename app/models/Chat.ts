import { TDb } from "./index";
import { Sequelize, Model, DataTypes } from "sequelize";

export default (sequelize: Sequelize) => {
  class Chat extends Model {

    static associate(models: TDb){
      this.belongsTo(models.Room, {
        foreignKey: 'room_id'
      })

      this.belongsTo(models.User, {
        foreignKey: 'user_id'
      })
    };
  }
  
  Chat.init({
    room_id: {
      type: DataTypes.UUID
    },
    user_id: {
      type: DataTypes.INTEGER,
      comment: '用户id, null为系统消息'
    },
    type: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '消息类型 0:系统 1:文字 2:图片 3.音频 4.视频 5.音乐分享 6.链接分享'
    },
    content: {
      type: DataTypes.STRING,
      comment: '消息内容'
    },
    state: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已读'
    },
  }, {
    sequelize,
    modelName: 'chat',
  })

  return Chat
}