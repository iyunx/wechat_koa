import config from '../../config';
import sequelize from '../libs/db';

import userFn from './User'
import contactFn from './Contact'
import remindFn from './Remind'
import roomFn from './Room'
import chatFn from './Chat'
import { random } from '../../utils';

export const User = userFn(sequelize)
export const Contact = contactFn(sequelize)
export const Remind = remindFn(sequelize)
export const Room = roomFn(sequelize)
export const Chat = chatFn(sequelize)

export type TDb = {
  User: typeof User
  Remind: typeof Remind
  Chat: typeof Chat
  Room: typeof Room
  Contact: typeof Contact
}

const db: TDb = {
  User,
  Contact,
  Remind,
  Chat,
  Room,
}
// 关联模型，执行
User.associate(db)
Contact.associate(db)
Remind.associate(db)
Room.associate(db)
Chat.associate(db)
// RoomUser.associate(db)

;(async () => await sequelize.sync())();

User.findOrCreate({
  where: {phone: '18081990075'},
  defaults: {
    name: 'admin',
    phone: '18081990075',
    password: '123456',
    self_id: random() +'_'+ new Date().getTime(),
    sex: false,
    avatar: '/avatar/1.jpg',
  }
}).then(() => {
  User.findOrCreate({
    where: {phone: '18081990071'},
    defaults: {
      name: '小可爱',
      phone: '18081990071',
      password: '123456',
      self_id: random() +'_'+ new Date().getTime(),
      sex: false,
      avatar: '/avatar/2.jpg',
    }
  })
}).then(() => {
  User.findOrCreate({
    where: {phone: '18081990072'},
    defaults: {
      name: '金秘书',
      phone: '18081990072',
      password: '123456',
      self_id: random() +'_'+ new Date().getTime(),
      sex: false,
      avatar: '/avatar/3.jpg',
    }
  })
}).then(() => {
  User.findOrCreate({
    where: {phone: '18081990073'},
    defaults: {
      name: '朴制贤',
      phone: '18081990073',
      password: '123456',
      self_id: random() +'_'+ new Date().getTime(),
      sex: false,
      avatar: '/avatar/4.jpg',
    }
  })
})

export {
 config, sequelize
}

export default db