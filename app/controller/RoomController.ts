import { Context } from "koa";
import { err, success } from "../libs";
import redis from "../libs/redis";
import { config, Contact, Room, User } from "../models";
import RoomService from "../service/RoomService";

class RoomController {
  async index(ctx: Context){
    const me = ((await RoomService.index(ctx))?.toJSON()) as any
    if(me){
      me.rooms.forEach((room: any) => {
        room.user = {}
        room.isGroup = false // 私聊天
        room.chat = { ...room.chats[0]}
        room.chat.type == 1 && (room.chat.content = room.chat.content.replace(/<.+?>/g, ''))
        delete room.chats
        // 数据修正
        room.Contacts.forEach((ru: any) => {
          if(ru.uid == ctx.user.id) {
            room.user.id = ru.fid
            room.user.name = ru.rname
            room.roomset = ru.roomset
          } else {
            room.user.avatar = ru.user.avatar
          }
        })
        delete room.Contacts
      })
      me.groups.forEach((g: any) => {
        g.chat = {...g.gchats[0]}
        g.isGroup = true // 群聊天
        g.roomset = g.group_user;
        g.chat.type == 1 && (g.chat.content = g.chat.content.replace(/<.+?>/g, ''))
        delete g.gchats
        delete g.group_user
      })
      // 排除不显示的房间
      me.rooms = me.rooms.filter((room: any) => room.roomset.state)
      // me.groups = me.groups.filter((g: any) => g.group_user.state)
    }
    success(ctx, me)
  }

  /**
   * 聊天数据
   * @param ctx 
   * @returns 
   */
  async show(ctx: Context){
    if(ctx.params.id.length != 36) return err(ctx, '你的房间ID错误')
    let ids = await redis.smembers(ctx.params.id)

    if(!ids.includes(ctx.user.id + '')) return err(ctx, '你无权访问')
    let rmchats = await RoomService.show(ctx)
    rmchats.chats.rows.sort((a, b) => {
      return Date.parse(a.getDataValue('created_at')) - Date.parse(b.getDataValue('created_at'))
    })
    success(ctx, rmchats)
  }

  /**
   * @param ctx 
   */
  async store(ctx: Context){
    const fids: number[] = ctx.request.body;
    success(ctx, fids)
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

  async upload(ctx: Context){
    const room_id = ctx.request.body.room_id
    const isGroup = ctx.request.body.isGroup.includes('true') ? true : false;
    const users = await redis.smembers(room_id)
    if(!users.includes(ctx.user.id + '')) return err(ctx, '你不在此房间')
    let file = JSON.parse(JSON.stringify(ctx.request.files)).files;
    const info = ['image', 'video']
    // type类型 1信息 2图片 3视频 4文件
    if(Array.isArray(file)) {
      file.map(item => {
        item.info = item.type;
        const num = info.indexOf(item.type.split('/')[0])
        let type = 2
        if(num == -1) type = 4
        if(num == 1) type = 3
        item.type = type
        const filePath = item.path.split('uploads')[1].replace(/\\/g, '/')
        item.path = config.server.url + filePath
      })
    } else {
      file.info = file.type;
      const num = info.indexOf(file.type.split('/')[0])
      let type = 2
      if(num == -1) type = 4
      if(num == 1) type = 3
      file.type = type
      const filePath = file.path.split('uploads')[1].replace(/\\/g, '/')
      file.path = config.server.url + filePath
      file = [file]
    }
    await RoomService.upload(ctx, file, isGroup)
    success(ctx, file)
  }
}

export default new RoomController()