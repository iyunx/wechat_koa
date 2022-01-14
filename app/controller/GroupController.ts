import { Context } from "koa";
import config from "../../config";
import { err, success } from "../libs";
import redis from "../libs/redis";
import GroupService from "../service/GroupService";


class GroupController {
  // 群管理首页
  async index(ctx: Context){
    const group = await GroupService.index(ctx)
    success(ctx, group)
  }
  // 创建群聊
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
  /**
   * 群聊条数等更新
   */
  async groupUserNum(ctx: Context) {
    const group = await GroupService.groupUserNum(ctx)
    success(ctx, group)
  }

  /**
   * 群友的邀请，或移除群友
   */
   async joinGroup(ctx: Context){
    const group = await GroupService.joinGroup(ctx)
    success(ctx, group)
  }

  async audio(ctx: Context){
    const file = JSON.parse(JSON.stringify(ctx.request.files)).files;
    file.type = (file.type as string).includes('audio') ? 5 : 3
    const filePath = file.path.split('uploads')[1].replace(/\\/g, '/')
    file.path = config.server.url + filePath
    await GroupService.audio(ctx, file)
    success(ctx, file)
  }

  async video(ctx: Context){
    console.log(ctx.request.files)
  }
  
}

export default new GroupController()