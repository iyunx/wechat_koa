import type { Context } from "koa";
import { isEquar, md5, random } from "../../utils";
import { success } from "../libs";
import { Op } from 'sequelize'
import { Group, GroupUser, User, Gchat } from '../models';
import redis from "../libs/redis";

class GroupService {
  async store(ctx: Context){
    let fids: {id: number, name: string, avatar: string}[] = ctx.request.body;
    
    let namer = ctx.user.name + '、'
    const imgr: string[] = [ctx.user.avatar]
    const user_ids: number[] = [ctx.user.id]
    fids.forEach(item => {
      namer.length < 100 && (namer += item.name + '、')
      imgr.length < 9 && imgr.push(item.avatar)
      user_ids.push(item.id)
    })

    fids = fids.sort((a, b) => a.id - b.id)

    namer = namer.slice(0, namer.length-1)
    const groups = await Group.findAll({
      where: {
        user_id: ctx.user.id
      }
    })
    
    const group = groups.find(item => isEquar(item.user_ids, user_ids))
    if(group) return group;

    const news = await Group.create({
      user_id: ctx.user.id,
      name: namer,
      img: imgr,
      user_ids
    })

    await redis.sadd(`my_group_${ctx.user.id}`, news.id)

    fids.forEach(async i => await redis.sadd(news.id, i.id))
    
    return news
  }

  async show(ctx: Context){
    const id = ctx.params.id
    const page = Number(ctx.query.page) || 1;
    const size = Number(ctx.query.size) || 20;
    
    const chats = await Gchat.findAndCountAll({
      where: {
        group_id: id
      },
      limit: size,
      offset: (page - 1) * size,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'avatar']
        }
      ]
    })

    const group = await GroupUser.findOne({
      where: {
        group_id: id,
        user_id: ctx.user.id
      },
      attributes: ['bg', 'follow', 'nickname', 'num', 'state'],
      include: {
        model: Group,
        attributes: ['id', 'name'],
        where: {
          id
        }
      }
    })

    return {
      ...chats,
      group
    }
  }
}

export default new GroupService()