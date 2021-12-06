import { Context } from "koa";
import { err, success, validator } from "../libs";
import RoomService from "../service/RoomService";
import UserService from '../service/UserService';
import { Rules } from 'async-validator';

class UserController {

  /**
   * 好友列表
   * @param ctx 
   * @returns 
   */
  async index(ctx: Context) {
    let user = await UserService.index(ctx)
    if(!user) {
      success(ctx, {lists: null, star: null, reminds: null})
      return;
    }
    
    let users = user.friend;
    users.sort((m, n) => m.Contact.initial.localeCompare(n.Contact.initial))
    // 好友按字母排序
    let ret: any = {}
    for (const item of users) {
      if(ret[item.Contact.initial]) {
        ret[item.Contact.initial].push(item)
      } else {
        ret[item.Contact.initial] = [item]
      }
    }
    // #序列好友拍到最后
    let n = ret['#']
    Reflect.deleteProperty(ret, '#')
    ret['#'] = n
    // 星标好友
    let star = []
    for (const item of users) {
      if(item.Contact.star) star.push(item)
    }

    // 未读新增好友信息
    let reminds = user.reminds.filter(item => !item.state)
    success(ctx, {lists: ret, star, reminds})
  }

  /**
   * 好友详情
   * @param ctx 
   * @returns 
   */
  async show(ctx: Context){
    const user = await UserService.show(ctx)
    success(ctx, user)
  }

  /**
   * 创建用户，在loginController
   * 这里是，创建好友关系
   * @param ctx 
   * @returns 
   */
  async store(ctx: Context) {
    // 自己加自己
    if(ctx.request.body.user_id == ctx.user.id) return success(ctx)
    const rules: Rules = {
      user_id: { required: true, message: '好友ID不能为空'},
      rname: { required: true, message: '好友昵称不能为空'},
    }
    let { data, error } = await validator(ctx, rules)
    if(error && !Array.isArray(error)) return err(ctx, error.message)
    let ret = await UserService.store(ctx)
    success(ctx)
    // err(ctx, '数据存储失败', 500)
  }

  /**
   * 查询用户，搜索用户 
   * @param ctx 
   * @returns 
   */
  async search(ctx: Context) {
    const rules: Rules = {
      str: [
        {type: 'string', required: true, message: '搜索不能为空'},
        {
          asyncValidator(rule, value){
            return new Promise((resolve, reject) => {
              if(/^\w+$/.test(value)){ resolve() }
              else reject('请输入字母数字下划线')
            })
          }
        }
      ]
    }
    const { error } = await validator(ctx, rules)
    if(error && !Array.isArray(error)) return err(ctx, error.message)

    const user = await UserService.search(ctx)
    success(ctx, user)
  }

  async remindIndex(ctx: Context) {
    // console.log(moment().add(3, 'days').valueOf() - moment().valueOf())
    let ret = await UserService.remindIndex(ctx)
    success(ctx, ret)
  }

  async remindShow(ctx: Context) {
    // console.log(moment().add(3, 'days').valueOf() - moment().valueOf())
    let ret = await UserService.remindShow(ctx)
    if(ret) success(ctx, ret)
    else err(ctx, '非法操作', 401)
  }

  /**
   * 创建好友两边关系，创建房间
   * 实时通讯，在我通过后，他的应出现我们的聊天信息窗口
   */
  async contact(ctx: Context){
    let rphone = ctx.request.body.rphone
    if(rphone && !/1[3-9]{1}\d{9}/.test(rphone)) {
      return err(ctx, '手机号不正确')
    }
    let room = await UserService.contact(ctx)
    success(ctx, room)
  }
}

export default new UserController()