import { Context } from "koa";
import { err, success } from "../libs";
import redis from "../libs/redis";
import { config, Contact, Room, User } from "../models";
import GroupService from "../service/GroupService";


class GroupController {
  async store(ctx: Context){
    const fids: {id: number, name: string}[] = ctx.request.body;
    const myFriends = await redis.smembers(`my_friend_${ctx.user.id}`)
    const boolArr = fids.map(u => myFriends.includes(String(u.id)))
    if(boolArr.includes(false)) return err(ctx, '非法操作，好友ID不存在')
    
    const group = await GroupService.store(ctx)
    success(ctx, group)
  }

  async show(ctx: Context){
    const group = await GroupService.show(ctx)
    success(ctx, group)
  }
}

export default new GroupController()