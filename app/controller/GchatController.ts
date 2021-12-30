import { Context } from "koa"
import { Gchat, Contact, GroupUser } from "../models"

class GchatController {
  async show(Ctx: Context){

  }
  async store (data: any) {
    if(!data.content.length) return
    await Gchat.create({
      group_id: data.room_id,
      user_id: data.user_id,
      type: data.type,
      content: data.content
    })
  }

  async groupUser(user_id: string, group_id: string){
    const gu = await GroupUser.findOne({
      where: {
        user_id,
        group_id
      }
    })
    gu && (gu.num += 1)
    gu?.save();
    return gu
  }
}

export default new GchatController()