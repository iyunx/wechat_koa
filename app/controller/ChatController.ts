import { Context } from "koa"
import { Chat, Contact } from "../models"

class ChatController {
  async show(Ctx: Context){

  }
  async store (data: any) {
    console.log(data)
    await Chat.create(data)
  }

  async contact(uid: number, room_id: number){
    let contacts = await Contact.findOne({
      where: {
        uid, room_id
      }
    })

    if(contacts) {
      const roomset = contacts.roomset
      roomset.num += 1
      roomset.state = true
      await Contact.update({
        roomset
      }, {
        where: {
          uid,
          room_id
        }
      })
    }
    return contacts?.toJSON()
  }
}

export default new ChatController()