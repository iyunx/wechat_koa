import type { Context } from "koa";
import { isEquar, md5, random } from "../../utils";
import { err, success } from "../libs";
import { Op } from 'sequelize'
import { Group, GroupUser, User, Gchat, Chat, Contact } from '../models';
import redis from "../libs/redis";
import moment from "moment";

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
    // 可用于判断群聊是否存在
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
      group_users: user_ids.map(item => ({user_id: item, num: 1})),
      gchats: [
        {type: 0, content: ctx.user.name + ' 创建了群聊'}
      ]
    }, {
      include: [GroupUser, Gchat]
    })
    
    // 创建了群，保存到redis，以便socket使用
    await redis.sadd(`my_group_${ctx.user.id}`, news.id)
    user_ids.forEach(async i => {
      await redis.sadd(news.id, i)
      await redis.sadd(`my_group_${i}`, news.id)
    })
    return news
  }

  async update(ctx: Context){
    const {name, notice, allow, adminIds, user_id} = ctx.request.body

    const group = await Group.findOne({
      where: {
        id: ctx.params.id
      }
    })

    if(!group) return err(ctx, '群不存在')
    
    if(!this.isAdmin(ctx.user.id, group.user_id, group.admin_ids)) {
      return err(ctx, '您无权操作')
    }

    name && name != group.name && (group.name = name)
    
    notice && (group.notice = {
      id: ctx.user.id,
      content: notice,
      created_at: moment().format('YYYY-MM-DD HH:mm')
    })

    if(allow != undefined){
      if(group.user_id != ctx.user.id) return err(ctx, '只有群主才能操作')
      group.allow = allow
    }

    if(adminIds){
      if(group.user_id != ctx.user.id) return err(ctx, '只有群主才能操作')
      const ads = (adminIds as number[]).filter(item => item != group.user_id)
      group.admin_ids = ads.length ? ads : null
    }

    if(user_id) {
      if(group.user_id != ctx.user.id) return err(ctx, '只有群主才能操作')
      group.admin_ids?.includes(user_id) && (group.admin_ids = group.admin_ids.filter(id => id != user_id));
      group.user_id = user_id
    }

    group.save()
      
    return success(ctx, group)
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
      attributes: ['bg', 'follow', 'nickname', 'num', 'state', 'remark'],
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


  async groupUser(ctx: Context){
    const {num, top, remark, disturb, shownick, nickname} = ctx.request.body
    const gu = await GroupUser.findOne({
      where: {
        group_id: ctx.params.id,
        user_id: ctx.user.id
      },
      attributes: ['group_id', 'user_id', 'num', 'top', 'state', 'remark', 'disturb', 'shownick', 'nickname'],
    })
    // console.log(ctx.query)
    // console.log(ctx.params)
    // console.log(ctx.request.body)

    if(gu) {
      num != undefined && (gu.num = num)
      top != undefined && (gu.top = top)
      remark != undefined && (gu.remark = remark)
      disturb != undefined && (gu.disturb = disturb)
      shownick != undefined && (gu.shownick = shownick)
      nickname != undefined && (gu.nickname = nickname)
      gu.state = true
      ctx.query.state != undefined && (gu.state = false)
      gu.save()
    }

    return gu
  }

  /**
   * 群友的邀请，或移除群友
   */
  async joinGroup(ctx: Context){
    const group_id = ctx.params.id as string
    const users: {id: number, avatar: string, name: string}[] = ctx.request.body.ids ? ctx.request.body.ids : [];
    const action = ctx.query.action ? ctx.query.action as string : null;

    const group = await Group.findOne({
      where: { id: group_id },
      include: { model: GroupUser }
    })
    if(group){
      // 群主或管理审核后，才能入群
      if(group.allow){
        console.log('审核入群')
      } else {
        // 无需审核，直接入群
        const img: Set<string> = new Set(group.img)
        const uids: Set<number> = new Set(group.user_ids)
        // 新增群友
        if(action == 'add'){
          users.forEach(async u => {
            if(!uids.has(u.id)){
              uids.add(u.id)
              img.size < 9 && img.add(u.avatar)
              // 新群员
              await redis.sadd(`my_group_${u.id}`, group_id)
              await redis.sadd(group_id, u.id)

              await GroupUser.create({
                user_id: u.id,
                group_id,
                num: 1,
              })
              await Gchat.create({
                group_id,
                type: 0,
                content: `${ctx.user.name} 邀请 ${u.name} 加入群聊`
              })
            }
          })
          // 有新的成员加入群聊
          if(group.user_ids.length < uids.size){
            group.group_users.forEach(async item => {
              if(item.user_id != ctx.user.id) {
                item.num+=1
                item.save()
              }
            })
            group.img = [...img]
            group.user_ids = [...uids]
            group.save()
          }
        } else {
          if(group.user_id != ctx.user.id) return null
          // 删除群友
          users.forEach(async u => {
            if(uids.has(u.id)) {
              uids.delete(u.id)
              img.delete(u.avatar)
              await redis.srem(`my_group_${u.id}`, group_id)
              await redis.srem(group_id, u.id)

              await GroupUser.destroy({
                where: {
                  user_id: u.id,
                  group_id
                }
              })

              await Gchat.create({
                group_id,
                type: 0,
                content: `${u.name}退出了群聊`
              })
            }
          })

          group.img = [...img]
          group.user_ids = [...uids]
          group.save()
        }
      }
      return group
    }
    return null
  }

  async audio(ctx: Context, file: {size: number, path: string, type: number, mtime: Date}){
    const room_id: string = ctx.request.body.room_id
    const isGroup: boolean = ctx.request.body.isGroup ? true : false
    const uids = await redis.smembers(room_id)
    if(isGroup) {
      await Gchat.create({
        group_id: room_id,
        user_id: ctx.user.id,
        type: file.type,
        content: file.path
      })
      uids.forEach(async u => {
        const gu = await GroupUser.findOne({
          where: {group_id: room_id, user_id: u}
        })
        gu && (gu.num += 1) && gu.save()
      })
    } else {
      await Chat.create({
        room_id,
        user_id: ctx.user.id,
        type: file.type,
        content: file.path
      })
      uids.forEach(async u => {
        const gu = await Contact.findOne({
          where: {group_id: room_id, uid: u}
        })
        gu && (gu.roomset.num += 1) && gu.save()
      })
    }
  }

  isAdmin(id: number, g_uid: number, admins: number[] | null){
    return id == g_uid ? true : admins ? admins.includes(id) ? true: false : false
  }

  
}

export default new GroupService()