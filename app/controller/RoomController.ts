import { Context } from "koa";
import { err, success } from "../libs";
import redis from "../libs/redis";
import { Contact, Room, User } from "../models";
import RoomService from "../service/RoomService";

class RoomController {
  async index(ctx: Context){
    const me = ((await RoomService.index(ctx))?.toJSON()) as any
    if(me){
      me.rooms.forEach((room: any) => {
        room.user = {}
        room.chat = { ...room.chats[0] }
        room.chat.content = room.chat.content.replace(/<.+?>/g, '')
        delete room.chats
        // 数据修正
        room.Contacts.forEach((ru: any) => {
          if(ru.uid == ctx.user.id) {
            room.user.id = ru.fid
            room.user.name = ru.rname
            room.user.created_at = ru.created_at
            room.roomset = ru.roomset
          } else {
            room.user.avatar = ru.user.avatar
          }
        })
        delete room.Contacts
      })
      // 排除不显示的房间
      me.rooms = me.rooms.filter((room: any) => room.roomset.state)
    }
    success(ctx, me)
  }

  /**
   * 聊天数据
   * @param ctx 
   * @returns 
   */
  async show(ctx: Context){
    if(ctx.params.id.length != 36) {
      return err(ctx, '你的房间ID错误')
    }
    let ids = await redis.smembers(ctx.params.id)

    if(!ids.includes(ctx.user.id + '')) {
      return err(ctx, '你无权访问')
    }
    let room  = (await RoomService.show(ctx))?.toJSON() as any;
    room.users = room.users.filter((user: any) => user.id == ctx.user.id)[0]
    room.users = room.users.Contact
    success(ctx, room)
  }

  /**
   * @param ctx 
   */
  async store(ctx: Context){
    const news = ctx.request.body
    console.log(news);
    success(ctx, news)
    // let ret = await Room.create({
    // }, {include: [
    //   {association: 'users', where: {id: ctx.user.id}},
    //   {association: 'users', where: {id: 2}}
    // ]})
    // success(ctx, ret)
  }

  /**
   * update contact number
   */
  async update(ctx: Context){
    await RoomService.update(ctx);
    success(ctx)
  }

  async roomset(ctx: Context) {
    let contact = await RoomService.roomset(ctx);
    success(ctx, contact)
  }
}

export default new RoomController()