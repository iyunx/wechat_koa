import { Context } from "koa";
import { err, success } from "../libs";
import redis from "../libs/redis";
import { config, Contact, Room, User } from "../models";
import GroupService from "../service/GroupService";


class GroupController {
  async store(ctx: Context){
    const fids: number[] = ctx.request.body;
    const myFriends = await redis.smembers(`my_friend_${ctx.user.id}`)
    const boolArr = fids.map(id => myFriends.includes(String(id)))
    const bool = boolArr.includes(false)
    if(bool) return err(ctx, '非法操作，好友ID不存在')
    
    const group = await GroupService.store(ctx)
    success(ctx, fids)
  }
}

export default new GroupController()