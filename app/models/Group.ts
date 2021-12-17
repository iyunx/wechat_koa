import { Sequelize, Model, DataTypes } from "sequelize";
import { TDb } from "./index";

export default (sequelize: Sequelize) => {
  class Group extends Model {
    id!: string
    uid!: string
    name!: string
    qrcode!: string
    notice!: string
    confirm!: boolean
    admin_ids!: string

    static associate(models: TDb){

    };
  }
  
  Group.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    uid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '群主'
    },
    name: {
      type: DataTypes.STRING,
      comment: '群名称',
    },
    qrcode: {
      type: DataTypes.STRING,
      comment: '群二维码'
    },
    notice: {
      type: DataTypes.STRING,
      comment: '群公告'
    },
    confirm: {
      type: DataTypes.BOOLEAN,
      comment: '是否只能通过群主或管理员才能要求朋友入群'
    },
    admin_ids: {
      type: DataTypes.JSON,
      comment: '管理员们'
    }
  }, {
    sequelize,
    modelName: 'group'
  })

  return Group
}