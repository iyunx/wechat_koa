import { Sequelize, Model, DataTypes } from "sequelize";
import { config, TDb } from "./index";
import { ucwords } from "../../utils";

type TPermission = {
  circle: boolean,
  seeme: boolean,
  seeyou: boolean
}
type TRemark = {
  from: string,
  who: 'TA' | 'ME',
  text: string,
  img: string
}
type TRoomset = {
  bg: string
  num: number // 未读信息数量
  top: boolean // 是否置顶 1置顶 0不置顶
  disturb: boolean // 是否开启免打扰 1开启 0关闭
  remind: boolean // 是否提醒 1提醒 0关闭
  start_id: string | null // 未读开始id
  state: boolean // 是否显示
}

export default (sequelize: Sequelize) => {
  class Contact extends Model {
    uid!: number
    fid!: number
    room_id!: string
    is_out!: boolean
    rname!: string
    rphone!: string
    initial!: string
    star!: boolean
    remark!: TRemark
    permission!: TPermission
    roomset!: TRoomset

    static associate(models: TDb){
      this.belongsTo(models.User, {
        foreignKey: 'uid',
        as: 'user'
      })

      this.belongsTo(models.Room, {
        foreignKey: 'room_id',
      })
    }
  }
  
  Contact.init({
    uid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '我的ID'
    },
    fid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '好友ID'
    },
    room_id: {
      type: DataTypes.UUID,
      comment: '房间id'
    },
    is_out: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否好友'
    },
    rname: {
      type: DataTypes.STRING,
      comment: '好友名称备注'
    },
    rphone: {
      type: DataTypes.JSON,
      comment: '手机号'
    },
    initial: {
      type: DataTypes.STRING,
      set(val: string){
        let i = '#'
        if(val.length) i = ucwords(val)
        this.setDataValue('initial', i)
      },
      comment: '名称首字母'
    },
    star: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '星标好友'
    },
    remark: {
      type: DataTypes.JSON,
      comment: '备注'
    },
    tag: {
      type: DataTypes.JSON,
      comment: '标签'
    },
    roomset: {
      type: DataTypes.JSON,
      get(){
        let ret: TRoomset = this.getDataValue('roomset')
        if(ret.bg.length>2) ret.bg = config.server.url + ret.bg
        return ret
      },
      set(val: TRoomset){
        if(val.bg && val.bg.includes(config.server.url)){
          val.bg = val.bg.replace(config.server.url, '')
        }
        this.setDataValue('roomset', val)
      },
      defaultValue: {bg: '', disturb: 0, top: 0, remind: 0, num: 0, start_id: null},
      comment: '房间相关设置'
    },
    permission: {
      type: DataTypes.JSON,
      comment: '朋友圈权限'
    },
  }, {
    sequelize,
    modelName: 'Contact'
  })
  
  return Contact
}