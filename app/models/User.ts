import { Model, Sequelize, DataTypes, Association, BelongsToGetAssociationMixin } from 'sequelize'
import { config, TDb} from './index';
import { md5 } from '../../utils'
import { TContact, TRemind, TRemark } from './types/userty'

export default (sequelize: Sequelize) => {
  class User extends Model {
    id!: number
    name!: string
    sex!: boolean
    self_id!: string
    phone!: string
    avatar!: string
    region!: string
    remark!: TRemark
    password!: string
    Contact!: TContact
    friend!: User[]
    reminds!: TRemind[]
    rooms!: any

    // 延迟加载
    public getRooms!: BelongsToGetAssociationMixin<'rooms'>

    static associate(models: TDb){
      this.belongsToMany(models.User, {
        through: 'Contact',
        as: 'friend',
        otherKey: 'fid',
        foreignKey: 'uid'
      })

      this.hasMany(models.Remind, {
        foreignKey: 'user_id'
      })

      this.hasMany(models.GroupUser, {
        foreignKey: 'user_id'
      })

      this.hasMany(models.Contact, {
        foreignKey: 'uid'
      })

      this.belongsToMany(models.Room, {
        through: models.Contact,
        foreignKey: 'uid',
        timestamps: false
      })

      this.hasMany(models.Chat, {
        foreignKey: 'user_id'
      })
    }
  }
  
  User.init({
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
      comment: '用户名'
    },
    phone: {
      type: DataTypes.STRING(22),
      unique: true,
      allowNull: false,
      comment: '用户手机号'
    },
    self_id: {
      type: DataTypes.STRING(60),
      unique: true,
      allowNull: false,
      comment: '用户微信号id'
    },
    sex: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '0男 1女'
    },
    avatar: {
      type: DataTypes.STRING,
      comment: '头像',
      get(){
        return config.server.url + this.getDataValue('avatar')
      },
      set(val: string){
        if(val.includes(config.server.url)){
          val = val.replace(config.server.url, '')
        }
        this.setDataValue('avatar', val)
      }
    },
    region: {
      type: DataTypes.STRING,
      comment: '地区'
    },
    remark: {
      type: DataTypes.JSON,
      get(){
        let re = this.getDataValue('remark')
        return re
      },
      set(val: TRemark){
        if(val.img.includes(config.server.url)){
          val.img = val.img.replace(config.server.url, '')
        }
        this.setDataValue('remark', val)
      },
      comment: '备注'
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '用户密码',
      set(val: string){
        this.setDataValue('password', md5(val))
      }
    }
  }, {
    sequelize,
    modelName: 'user',
  })

  return User
}