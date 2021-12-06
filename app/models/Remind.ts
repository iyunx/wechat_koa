import { Sequelize, Model, DataTypes } from "sequelize";
import { config, TDb } from "./index";

type TContent = {
  id: number
  name: string
  avatar: string
  add_name: string
  from: string
}

export default (sequelize: Sequelize) => {
  class Remind extends Model {
    id!: string
    user_id!: number
    content!: TContent
    state!: boolean;
    is_friend!: boolean;

    static associate(models: TDb){
      this.belongsTo(models.User, {
        foreignKey: 'user_id'
      })
    };
  }
  
  Remind.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    state: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已读'
    },
    content: {
      type: DataTypes.JSON,
      get(){
        let con = this.getDataValue('content')
        con.avatar = config.server.url + con.avatar
        return con
      },
      set(val: TContent){
        if(val.avatar && val.avatar.includes(config.server.url)){
          val.avatar = val.avatar.replace(config.server.url, '')
        }
        this.setDataValue('content', val)
      },
      comment: '通知内容'
    },
    is_friend: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否好友'
    }
  }, {
    sequelize,
    modelName: 'remind'
  })

  return Remind
}