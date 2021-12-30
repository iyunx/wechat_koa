import type { Server, Socket } from 'socket.io'
import { verify } from './jwt';
import redis from './redis';
import ChatController from '../controller/ChatController'
import moment from 'moment'
import GchatController from '../controller/GchatController';

const isJoinRoom = async (socket: Socket, roomId: string, meId: number) => {
  if(!socket.rooms.has(roomId)) {
    let uids = await redis.smembers(roomId)
    uids.includes(meId + '') && socket.join(roomId)
  }
}

const socket = (io: Server) => {
  io.use(async (socket, next) => {
    let token = socket.handshake.auth.token;
    try {
      let met: any = await verify(token)
      // socket.me = met
      Reflect.defineProperty(socket, 'me', {value: met})
      // 通过好友申请，房间提醒
      socket.join('notice_' + met.id)
      // 自己的所有房间这里必须先加入
      let rooms = await redis.smembers(`my_room_${met.id}`)
      let groups = await redis.smembers(`my_group_${met.id}`)
      socket.join([...rooms, ...groups])
      next()
    } catch (error) {
      let err = new Error()
      // @ts-ignore
      err.status = 401
      err.message = 'not authorized'
      next(err)
    }
  })

  io.on('connection', async socket => {
    // https://socket.io/docs/v4/emit-cheatsheet/
    // 消息群发，自己除外
    // socket.broadcast.emit('message', data)
    // 仅发自己
    // socket.emit('message', data)
    let me = Reflect.get(socket, 'me') as {id: number, name: string, avatar: string}
    // userRemind 加id为好友，就发送消息给这个id
    socket.on('userRemind', (fid) => {
      socket.to(`notice_${fid}`).emit('userRemind', me.id)
      // socket.to(socket.id).emit('userRemind', me_id)
    })
    // gr = 0 为私聊 1为群聊
    socket.on('message', async (content: any, room: string, type: number, gr = 0) => {
      if(!socket.rooms.has(room)) return
      const value = {
        type,
        content,
        room_id: room,
        user_id: type ? me.id : null,
        user: type ? { id: me.id, avatar: me.avatar, name: me.name} : null
      }
      if(type == 1){
        gr ? GchatController.store(value) : ChatController.store(value)
      } else if(type >=2 && type < 4) {
        // 图片上传的时候就已经保存信息到数据库了
        value.content = content
      } else if(type == 4) {
        // 文件上传的时候就已经保存信息到数据库了
        value.content = content
      }
      io.to(room).emit('message', value)
    })
    // 通过好友关系后，加入此房间
    socket.on('roomJoin', async roomId => {
      isJoinRoom(socket, roomId, me.id)
    })
    // 通知对方，建立好友关系，推送消息
    socket.on('roomlist', async (room, fid, type, msg) => {
      // 未进入聊天室
      isJoinRoom(socket, room, me.id)

      const now = moment().format()
      const message = msg.trim()
      const value = {
        chat: {
          content: message.length ? message : '你好，我是' + me.name,
          type: message.length ? type : 0,
          created_at: now
        },
        id: room,
        roomset: {},
        user: { id: me.id, avatar: me.avatar, name: me.name, created_at: now}
      }
      // 存储，这里可优化到redis，定时存储到数据库
      let contact = (await ChatController.contact(fid, room)) as any
      // await ChatController.contact(me.id, room)
      value.roomset = contact.roomset
      socket.to(`notice_${fid}`).emit('roomlist', value)
    })
    // 通知对方，群聊创立，推送消息
    socket.on('grouplist', async (gid, type, msg) => {
      // 未进入聊天室
      isJoinRoom(socket, gid, me.id)

      const now = moment().format()
      const message = msg.trim()
      const value = {
        chat: {
          content: message,
          type: message.length ? type : 0,
          created_at: now
        },
        id: gid,
        roomset: {},
        user: { id: me.id, avatar: me.avatar, name: me.name, created_at: now}
      }
      // 存储，这里可优化到redis，定时存储到数据库
      // 通知所有群友，新消息
      const fids = await redis.smembers(gid)
      fids.forEach(async id => {
        if(me.id == Number(id)) return;
        const room = await GchatController.groupUser(id, gid)
        if(room) value.roomset = room
        socket.to(`notice_${id}`).emit('roomlist', value)
      })
    })


  })
}

export default socket