import { Context } from "koa"
import { Gchat, Contact } from "../models"

class GchatController {
  async show(Ctx: Context){

  }
  async store (data: any) {
    await Gchat.create(data)
  }
}

export default new GchatController()