import { Sequelize, Model, DataTypes } from "sequelize";
import { TDb } from "./index";

export default (sequelize: Sequelize) => {
  class GroupUser extends Model {
    id!: string

    static associate(models: TDb){

    };
  }
  
  GroupUser.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    uid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户id'
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '群id'
    },
    remark: {
      type: DataTypes.STRING,
      comment: '群备注 仅自己可见'
    },
    isTop: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '置顶聊天'
    },
    disturb: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '打扰'
    },
    follow: {
      type: DataTypes.JSON,
      comment: '关注的群友'
    },
    nickname: {
      type: DataTypes.STRING,
      comment: '我在群内的昵称'
    },
    gnick: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否显示群成员昵称',
    }
  }, {
    sequelize,
    modelName: 'group_user'
  })

  return GroupUser
}