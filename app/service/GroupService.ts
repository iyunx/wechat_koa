import type { Context } from "koa";
import { md5, random } from "../../utils";
import { success } from "../libs";
import { User } from '../models';

class GroupService {
  async store(ctx: Context){
    const fids: number[] = ctx.request.body;
    success(ctx, fids)
  }
}

export default new GroupService()