import { config, TDb } from "./index";
import { Sequelize, Model, DataTypes } from "sequelize";

export default (sequelize: Sequelize) => {
  class Gchat extends Model {
    group_id!: string
    user_id!: number
    type!: number
    content!: string

    static associate(models: TDb){
      this.belongsTo(models.Group, {
        foreignKey: 'group_id'
      })

      this.belongsTo(models.User, {
        foreignKey: 'user_id'
      })
    };
  }
  
  Gchat.init({
    group_id: {
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
      type: DataTypes.STRING(1024),
      get(){
        if(this.getDataValue('type') == 2 || this.getDataValue('type') == 3 || this.getDataValue('type') == 5){
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
          if(this.getDataValue('type') <= 3 || this.getDataValue('type') == 5){
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
  }, {
    sequelize,
    modelName: 'gchat',
  })

  return Gchat
}