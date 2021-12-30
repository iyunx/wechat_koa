import type { Context } from "koa";
import { isEquar, md5, random } from "../../utils";
import { success } from "../libs";
import { Op } from 'sequelize'
import { Group, GroupUser, User, Gchat } from '../models';
import redis from "../libs/redis";

class GroupService {
  // 群管理首页
  async index(ctx: Context){
    const id = ctx.params.id
    return await Group.findOne({
      where: {
        id
      },
      attributes: {
        exclude: ['updated_at']
      },
      include: {
        model: User,
        attributes: ['id', 'name', 'avatar'],
        through: {
          attributes: {
            exclude: ['bg', 'num', 'state', 'updated_at']
          }
        }
      }
    })
  }

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
    // 没有就创建群聊, 创建关联
    const news = await Group.create({
      user_id: ctx.user.id,
      name: namer,
      img: imgr,
      user_ids,
      group_users: user_ids.map(item => ({user_id: item})),
      gchats: [
        {type: 0, content: ctx.user.name + ' 创建了群聊'}
      ]
    }, {
      include: [GroupUser, Gchat]
    })
    
    // 创建了群，保存到redis，以便socket使用
    await redis.sadd(`my_group_${ctx.user.id}`, news.id)
    user_ids.forEach(async i => await redis.sadd(news.id, i))
    return news
  }

  async show(ctx: Context){
    const group_id = ctx.params.id
    const page = Number(ctx.query.page) || 1;
    const size = Number(ctx.query.size) || 20;
    
    const chats = await Gchat.findAndCountAll({
      where: {
        group_id
      },
      limit: size,
      offset: (page - 1) * size,
      order: [
        ['created_at', 'DESC']
      ],
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'avatar']
        }
      ]
    })

    const group = await GroupUser.findOne({
      where: {
        group_id,
        user_id: ctx.user.id
      },
      attributes: ['bg', 'follow', 'nickname', 'num', 'state'],
      include: {
        model: Group,
        attributes: ['id', 'name'],
        where: {
          id: group_id
        }
      }
    })

    return {
      ...chats,
      group
    }
  }

  async update(ctx: Context){
    const gu = await GroupUser.findOne({
      where: {
        group_id: ctx.params.id,
        user_id: ctx.user.id
      },
      attributes: ['group_id', 'user_id', 'num', 'top', 'state'],
    })

    if(gu) {
      ctx.query.num != undefined && (gu.num = Number(ctx.query.num as string))
      ctx.query.top != undefined && (gu.top = ctx.query.top == 'true' ? true : false)
      gu.state = true
      ctx.query.state != undefined && (gu.state = false)
      gu.save()
    }

    return gu
  }

  
}

export default new GroupService()