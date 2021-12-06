import type { Context } from "koa";
import sq, { Op } from "sequelize";
import { md5, random } from "../../utils";
import redis from "../libs/redis";
import { User, Room, Chat, Contact, sequelize } from '../models';

class RoomService {
  // 当前用户的聊天列表
  async index(ctx: Context){
    return User.findOne({
      where: {id: ctx.user.id},
      attributes: ['id'],
      include: [
        {
          model: Room,
          attributes: ['id'],
          through: { attributes: []},
          include: [
            {
              model: Contact,
              attributes: ['uid', 'fid', 'rname', 'roomset', 'created_at'],
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
        }
      ]
    })
  }
  // 与某人，或某群的聊天详情页面
  async show(ctx: Context){
    let room = await Room.findOne({
      where: {id: ctx.params.id},
      attributes: [],
      include: [
        {
          model: Chat,
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'avatar']
            }
          ]
        },
        {
          model: User,
          attributes: ['id'],
          through: {
            attributes: ['uid', 'roomset', 'rname', 'fid']
          }
        }
      ]
    })

    // if(room) {
    //   let rom = room.toJSON() as any
    //   let me = rom.users.filter((user: any) => user.id == ctx.user.id && user.Contact.roomset.num > 0)
    //   if(me.length && me[0].Contact.roomset.num) {
    //     const roomset = me[0].Contact.roomset
    //     roomset.num = 0
    //     await Contact.update({
    //       roomset
    //     }, {
    //       where: {
    //         uid: ctx.user.id,
    //         room_id: ctx.params.id
    //       }
    //     })
    //   }
    // }

    return room
  }
  // 查看或创建聊天房间room
  async store(ctx: Context, fid: number){
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
}

export default new RoomService()