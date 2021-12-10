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
        room.chat = { ...room.chats[0] }
        room.chat.type == 1 && (room.chat.content = room.chat.content.replace(/<.+?>/g, ''))
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
    
    room.users = room.users.filter((user: any) => user.id == ctx.user.id)[0].Contact
    success(ctx, room)
  }

  /**
   * @param ctx 
   */
  async store(ctx: Context){
    const news = ctx.request.body
    success(ctx, news)
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
    await RoomService.upload(ctx, file)
    success(ctx, file)
  }
}

export default new RoomController()