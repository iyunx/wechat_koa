import { Context } from "koa";
import { err, success } from "../libs";
import redis from "../libs/redis";
import { config, Contact, Room, User } from "../models";
import GroupService from "../service/GroupService";


class GroupController {
  // 群管理首页
  async index(ctx: Context){
    const group = await GroupService.index(ctx)
    success(ctx, group)
  }

  async store(ctx: Context){
    const fids: {id: number, name: string}[] = ctx.request.body;
    const myFriends = await redis.smembers(`my_friend_${ctx.user.id}`)
    const boolArr = fids.map(u => myFriends.includes(String(u.id)))
    if(boolArr.includes(false)) return err(ctx, '非法操作，好友ID不存在')
    
    const group = await GroupService.store(ctx)
    success(ctx, group)
  }

  async show(ctx: Context){
    if(ctx.params.id.length != 36) return err(ctx, '你的房间ID错误')
    let ids = await redis.smembers(ctx.params.id)

    if(!ids.includes(ctx.user.id + '')) return err(ctx, '你无权访问')

    const group = await GroupService.show(ctx)
    group.rows.sort((a, b) => {
      return Date.parse(a.getDataValue('created_at')) - Date.parse(b.getDataValue('created_at'))
    })
    success(ctx, group)
  }

  async update(ctx: Context) {
    const group = await GroupService.update(ctx)
    success(ctx, group)
  }

  
}

export default new GroupController()