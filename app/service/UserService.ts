import { Context } from 'koa';
import { Contact, User, Remind, Room, sequelize, Chat } from '../models';
import redis from '../libs/redis';
import { Transaction } from 'sequelize'
const t = new Transaction(sequelize, {})

class UserService {
  async index(ctx: Context){
    return User.findOne({
      where: {id: ctx.user.id},
      attributes: ['id', 'name'],
      include: [
        {
          model: User,
          as: 'friend',
          attributes: ['id', 'name', 'sex', 'avatar'],
          through: {
            attributes: ['rname', 'star', 'initial'],
            where: {
              is_out: true
            }
          }
        },
        {
          model: Remind,
          attributes: ['id', 'user_id', 'state', 'content']
        }
      ]
    })
  }

  /**
   * params: ctx.params.id
   * query: ctx.query.id || ctx.request.query.id
   * @param ctx 
   * @returns 
   */
  async show(ctx: Context){
    let id = ctx.params.id
    let ismyFriend = await redis.sismember(`my_friend_${ctx.user.id}`, id);
    // 是朋友
    if(ismyFriend) {
      let me = await User.findOne({
        where: {id: ctx.user.id},
        attributes: ['id', 'name'],
        include: {
          model: User,
          as: 'friend',
          where: {id},
          attributes: ['id', 'name', 'sex', 'avatar', 'self_id'],
          through: {
            where: { is_out: true }
          }
        }
      })
      if(me){
        let friend = me.friend[0]
        return {friend, room: friend.Contact.room_id}
      }
      // 清理redis啦
      await redis.srem(`my_friend_${ctx.user.id}`, id)
    }
    // 不是朋友
    return User.findOne({
      where: {id},
      attributes: ['id', 'name', 'sex', 'avatar', 'region']
    })
  }

  /**
   * 创建好友关系，单向，对方确认，is_out = true 后，才是双向
   * remind contact 两个表
   * @param ctx 
   * @returns 
   */
  async store(ctx: Context) {
    let {user_id, rname, content, permission}: {
      user_id: number,
      rname: string,
      content: {id: number, name: string, from: string, avatar: string, add_name: string},
      permission: {circle: boolean, seeme: boolean, seeyou: boolean}
    } = ctx.request.body;

    content = {
      id: ctx.user.id,
      name: ctx.user.name,
      avatar: ctx.user.avatar,
      add_name: content.add_name,
      from: content.from
    }

    let remind = await Remind.findOne({
      where: {
        user_id,
        content: {
          id: ctx.user.id
        },
        // 未读：修改，已读：新增
        // is_friend: false
      }
    })
    if(remind) {
      await remind.update({
        content
      })
    } else {
      await Remind.create({
        user_id,
        content
      })
    }
    // 对好友的备注
    let remark = {
      from: content.from,
      who: 'ME',
      text: '',
      img: ''
    }
    // 添加好友，中间表is_out = false 默认false 为单向添加好友
    return Contact.findOrCreate({
      where: {
        uid: ctx.user.id,
        fid: user_id,
      },
      defaults: {
        rname,
        remark,
        initial: rname,
        permission
      }
    })
  }

  async search(ctx: Context) {
    let more = ctx.query.str as string

    let str: { [x: string]: number | string } = {}

    more && /^1[3-9]\d{9}$/.test(more) ? str.phone = more : str.self_id = more;

    const user = await User.findOne({
      where: str,
      attributes: ['id', 'name', 'sex', 'avatar', 'region']
    })
    return user;
  }

  async remindIndex(ctx: Context) {
    let ret = await Remind.findAll({
      where: {
        user_id: ctx.user.id,
      },
      order: [
        ['updated_at', 'DESC']
      ]
    })
    ret.forEach(item => {
      if(!item.state) {
        item.state = true
        item.save()
      }
    })
    return ret
  }

  async remindShow(ctx: Context) {
    return Remind.findOne({
      where: {
        id: ctx.params.id,
        user_id: ctx.user.id
      }
    })
  }

  /**
   * 创建好友两边关系，创建房间
   * @param ctx 
   * @returns 
   */
  async contact(ctx: Context){
    let {fid, rname, rphone, permission, remark}: {
      fid: number,
      rname: string,
      rphone: string | null,
      permission: {circle: boolean, seeme: boolean, seeyou: boolean},
      remark: {from: string, text: string, img: string, who: 'TA' | 'ME'}
    } = ctx.request.body.contact;
    let remind_id = ctx.request.body.remind_id;

    // rphone去空
    rphone = rphone && rphone.length ? rphone : null
    // 他人申请我为好友，他对我信息备注的中间表
    const you_contact = await Contact.findOne({
      where: {
        uid: fid,
        fid: ctx.user.id,
        is_out: false
      }
    })

    if(!you_contact) throw new Error('非法操作，请勿越权')

    let remind = await Remind.findByPk(remind_id)
    if(!remind) throw new Error('remind信息不存在')
    if(remind.user_id != ctx.user.id) throw new Error('你无权操作')

    await remind.update({is_friend: true})

    remark.who = 'TA'

    let room = await Room.create()
      .then(async room => {
        // 他加我好友，他对我的信息中间表更新
        await you_contact.update({is_out: true, room_id: room.id})
        return room
      })
      .then(async room => {
        // 我通过他好友申请，我的信息中间表，他的内容创建
        await Contact.create({
          uid: ctx.user.id,
          fid,
          room_id: room.id,
          is_out: true,
          rname,
          initial: rname,
          rphone,
          permission,
          remark: {
            who: remark.who,
            from: remark.from,
            text: remark.text,
            img: remark.img,
          }, 
        })
        return room
      })
      .then(room => {
        Chat.create({room_id: room.id, type: 0, content: '你们已经是好友了，现在可以开始聊天了'})
        return room
      })
    // 我的好友列表
    await redis.sadd(`my_friend_${ctx.user.id}`, fid)
    // 我的房间列表
    await redis.sadd(`my_room_${ctx.user.id}`, room.id)

    await redis.sadd(`my_friend_${fid}`, ctx.user.id)
    await redis.sadd(`my_room_${fid}`, room.id)
    // 房间的用户列表
    await redis.sadd(room.id, ctx.user.id, fid)
    return room
  }
}

export default new UserService()