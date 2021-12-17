import { Sequelize, Model, DataTypes } from "sequelize";
import { TDb } from "./index";

export default (sequelize: Sequelize) => {
  class Room extends Model {
    id!: string

    static associate(models: TDb){
      this.belongsToMany(models.User, {
        // through: models.RoomUser,
        through: models.Contact,
        foreignKey: 'room_id',
        timestamps: false
      })

      // this.hasMany(models.RoomUser, {
      this.hasMany(models.Contact, {
        foreignKey: 'room_id',
        // as: 'ru'
      })

      this.hasMany(models.Chat, {
        foreignKey: 'room_id'
      })
    };
  }
  
  Room.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    text: {
      type: DataTypes.TEXT
    }
  }, {
    sequelize,
    modelName: 'room'
  })

  return Room
}