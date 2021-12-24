import { Context, Next } from "koa";
import { Op } from "sequelize";
import { err } from "../libs";
import { verify } from "../libs/jwt";
import redis from '../libs/redis'
import { Contact, Group, Room, User } from "../models";

const AuthMiddleware = async (ctx: Context, next: Next) => {
  const token = ctx.headers.authorization;
  if(token) {
    let user = (await verify(token)) as any
    ctx.user = user
    // 好友id集合
    await getMeInfo(ctx)

    await next()
  }  else {
    err(ctx, '请登录', 401)
  }
}

/**
 * 用户房间room_id集合
 * 用户朋友user_id集合
 * 用户本人信息me
 * @param ctx 
 * @returns 
 */
const getMeInfo = async (ctx: Context) => {
  let id: number = ctx.user.id
  // 任何数据类型，都可删除，先删除，再存储
  // await redis.flushall()
  // redis.del(`user_${id}`)
  // redis.del(`room_${id}`)
  let myFriend = await redis.smembers(`my_friend_${id}`)
  if(myFriend.length) return myFriend;

  const user = await User.findOne({
    where: {id},
    attributes: ['id', 'name', 'phone', 'avatar', 'self_id'],
    include: [
      {
        model: User,
        as: 'friend',
        attributes: ['id'],
        through: {
          where: {is_out: true},
          attributes: []
        }
      },
      {
        model: Room,
        attributes: ['id'],
        through: {
          attributes: []
        },
        include: [
          {model: User, attributes: ['id'], through: {attributes: []}}
        ]
      },
      {
        model: Group,
        attributes: ['id'],
        through: {
          attributes: []
        },
        include: [
          {model: User, attributes: ['id'], through: { attributes: []} }
        ]
      }
    ]
  })

  if(!user) return err(ctx, '请登录', 401)
  // 存储朋友id
  let i = (user.toJSON()) as any;
  if(i.friend.length) {
    i.friend.forEach( async (item: any) => {
      await redis.sadd(`my_friend_${id}`, item.id)
    })
  }
  // 存储私聊房间id
  if(i.rooms.length) {
    i.rooms.forEach(async (rom: any) => {
      // redis.del(rom.id)
      await redis.sadd(`my_room_${id}`, rom.id)
      await redis.sadd(rom.id, rom.users[0].id, rom.users[1].id)
    })
  }
  // 群聊id
  if(i.groups.length) {
    i.groups.forEach(async (group: any) => {
      await redis.sadd(`my_group_${id}`, group.id)
      group.users.forEach(async (item: any) => await redis.sadd(group.id, item.id))
    })
  }
}

export default AuthMiddleware