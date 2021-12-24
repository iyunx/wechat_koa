import { Sequelize, Model, DataTypes } from "sequelize";
import { TDb } from "./index";

export default (sequelize: Sequelize) => {
  class GroupUser extends Model {
    user_id!: number
    group_id!: string
    num!: number
    bg!: string
    remark!: string
    top!: boolean
    disturb!: boolean
    follow!: object
    nickname!: string
    shownick!: boolean
    state!: boolean
    group!: object

    static associate(models: TDb){
      this.belongsTo(models.Group, {
        foreignKey: 'group_id'
      })
    };
  }
  
  GroupUser.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户id'
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '群id'
    },
    num: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '未读消息数量'
    },
    bg: {
      type: DataTypes.STRING,
      comment: '群背景图片'
    },
    remark: {
      type: DataTypes.STRING,
      comment: '群备注 仅自己可见'
    },
    top: {
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
    shownick: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否显示群成员昵称',
    },
    state: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否显示群',
    }
  }, {
    sequelize,
    modelName: 'group_user'
  })

  return GroupUser
}