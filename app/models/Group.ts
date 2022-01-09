import { Sequelize, Model, DataTypes, HasManyCreateAssociationMixin } from "sequelize";
import { config, TDb, TGroupUser, TGchat } from "./index";

export default (sequelize: Sequelize) => {
  class Group extends Model {
    id!: string
    uid!: string
    name!: string
    img!: string[]
    qrcode!: string
    notice!: string
    allow!: boolean
    admin_ids!: string
    user_id!: number
    user_ids!: number[]
    readonly group_users!: any[]
    readonly gchats!: any[]

    static associate(models: TDb){
      // 群主
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'leader'
      })

      this.belongsToMany(models.User, {
        through: models.GroupUser,
        foreignKey: 'group_id',
      })

      this.hasMany(models.Gchat, {
        foreignKey: 'group_id'
      })

      this.hasMany(models.GroupUser, {
        foreignKey: 'group_id'
      })
    };
  }
  
  Group.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '群主id'
    },
    name: {
      type: DataTypes.STRING,
      comment: '群名称',
    },
    img: {
      type: DataTypes.JSON,
      get(){
        const imgs = this.getDataValue('img')
        return imgs.map((img: string) => img.includes(config.server.url) ? img : config.server.url + img)
      },
      set(val: string[]){
        const value: string[] = []
        val.forEach((img: string) => {
          img.includes(config.server.url) ? value.push(img.slice(config.server.url.length)) : value.push(img)
        })
        this.setDataValue('img', value)
      },
      comment: '群头像',
    },
    qrcode: {
      type: DataTypes.STRING,
      comment: '群二维码'
    },
    notice: {
      type: DataTypes.STRING,
      comment: '群公告'
    },
    allow: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否只能通过群主或管理员审核后，才能入群'
    },
    admin_ids: {
      type: DataTypes.JSON,
      comment: '管理员们'
    },
    user_ids: {
      type: DataTypes.JSON,
      comment: '群成员们'
    }
  }, {
    sequelize,
    modelName: 'group'
  })

  return Group
}