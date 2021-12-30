import type { Context } from "koa";
import { User, Room, Chat, Contact, sequelize, config, Group, Gchat } from '../models';

class RoomService {
  // 当前用户的聊天列表
  async index(ctx: Context){
    return User.findOne({
      where: {id: ctx.user.id},
      attributes: ['id'],
      include: [
        {
          model: Room,
          attributes: ['id', 'created_at'],
          through: { attributes: []},
          include: [
            {
              model: Contact,
              attributes: ['uid', 'fid', 'rname', 'roomset'],
              include: [ { model: User, as: 'user', attributes: ['id', 'avatar'] } ],
            },
            {
              model: Chat,
              limit: 1,
              attributes: [
                'id', 'content', 'type', 'created_at'
              ],
              order: [
                ['id', 'DESC']
              ]
            }
          ],
          order: [
            [Chat, 'id', 'DESC']
          ]
        },
        {
          model: Group,
          attributes: ['id', 'img', 'name', 'created_at'],
          through: {
            attributes: ['bg', 'num', 'remark', 'top', 'disturb', 'follow', 'nickname', 'shownick']
          },
          include: [
            {
              model: Gchat,
              limit: 1,
              attributes: ['id', 'content', 'type', 'created_at'],
              order: [
                ['id', 'DESC']
              ]
            }
          ]
        }
      ]
    })
  }
  // 与某人，或某群的聊天详情页面
  async show(ctx: Context){
    const page = Number(ctx.query.page) ?? 1
    const size = Number(ctx.query.size) ?? 20
    const room_id = ctx.params.id

    const chats = await Chat.findAndCountAll({
      where: {
        room_id
      },
      limit: size,
      offset: (page - 1) * size,
      order: [
        ['created_at', 'DESC']
      ],
      include: {
        model: User,
        attributes: ['id', 'name', 'avatar']
      }
    })

    const friend = await Contact.findOne({
      where: {
        uid: ctx.user.id,
        room_id 
      },
      attributes: ['uid', 'roomset', 'rname', 'fid', 'room_id']
    })

    return {
      chats,
      friend
    }
  }
  // 查看或创建聊天房间room
  async store(ctx: Context){
    // const fids: number[] = ctx.request.body;
    // await Room.create()
  }

  async update(ctx: Context) {
    console.log('update')
    let con = await Contact.findOne({
      where: {
        room_id: ctx.params.id,
        uid: ctx.user.id
      }
    })
    if(con && con.roomset.num) {
      const roomset = con.roomset
      roomset.num = 0
      Contact.update({
        roomset
      }, {
        where: {
          uid: ctx.user.id,
          room_id: ctx.params.id
        }
      })
    }
    return con
  }

  async roomset(ctx: Context) {
    let con = await Contact.findOne({
      where: {
        room_id: ctx.params.id,
        uid: ctx.user.id
      }
    })
    if(con) {
      const roomset = con.roomset
      ctx.query.num != undefined && (roomset.num = Number(ctx.query.num as string))
      ctx.query.top != undefined && (roomset.top = ctx.query.top == 'true' ? true : false)
      // 重要，勿删
      roomset.state = true
      ctx.query.state != undefined && (roomset.state = false)
      await Contact.update({
        roomset
      }, {
        where: {
          uid: ctx.user.id,
          room_id: ctx.params.id
        }
      })
    }
    return con
  }

  async upload(ctx: Context, file: any[], isGroup: boolean){
    const room_id = ctx.request.body.room_id
    
    file.forEach(async (item: any) => {
      isGroup ?
      await Gchat.create({
        group_id: room_id,
        user_id: ctx.user.id,
        type: item.type,
        content: item.type == 4 ? {url: item.path, name: item.name} : item.path,
      })
      :
      await Chat.create({
        room_id,
        user_id: ctx.user.id,
        type: item.type,
        content: item.type == 4 ? {url: item.path, name: item.name} : item.path,
      })
    })
  }
}

export default new RoomService()