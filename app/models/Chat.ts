import { config, TDb } from "./index";
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
      comment: '消息类型 0:系统 1:文字 2:图片 3.视频 4.文件 5.音乐录音 6.链接分享'
    },
    content: {
      type: DataTypes.STRING,
      get(){
        if(this.getDataValue('type') == 2 || this.getDataValue('type') == 3){
          return config.server.url + this.getDataValue('content')
        }
        if(this.getDataValue('type') == 4) {
          const content = JSON.parse(this.getDataValue('content'))
          content.url = config.server.url + content.url
          return content
        }
        return this.getDataValue('content')
      },
      set(val: any){
        if(this.getDataValue('type') >= 2 ){
          if(this.getDataValue('type') <= 3 ){
            val.includes(config.server.url) && (val = val.slice(config.server.url.length))
            return this.setDataValue('content', val)
          } else {
            val.url.includes(config.server.url) && (val.url = val.url.slice(config.server.url.length))
            return this.setDataValue('content', JSON.stringify(val))
          }
        }
        this.setDataValue('content', val)
      },
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