import type { Context } from "koa";
import { md5, random } from "../../utils";
import { User } from '../models';
import { pinyin } from 'pinyin-pro'

class LoginService {
  async login(ctx: Context){
    const {phone, password} = ctx.request.body
    const user = await User.findOne({
      where: {phone}
    })

    if(!user) {
      let err = new Error('用户不存在')
      // @ts-ignore
      err.status = 400
      return err
    }

    if(user.password !== md5(password) ) {
      let err = new Error('密码错误')
      // @ts-ignore
      err.status = 400
      return err
    } 

    return user
  }

  async register(ctx: Context){
    const { name, phone, password }: {name: string, phone: string, password: string} = ctx.request.body;

    let user = await User.findOne({where: { phone } });

    if(user) {
      let err = new Error('手机号已注册')
      // @ts-ignore
      err.status = 400
      return err
    }

    const self_id = random() +'_'+ new Date().getTime()

    // let initial = '#';
    // //escape()函数会将汉字转换开头位%u字符串，字母或特殊字符无变化
    // if(escape(name[0]).includes('%u')){
    //   initial = pinyin(name[0], { toneType: 'none' })[0]
    // }
    // if(/[A-Za-z]/.test(name[0])) {
    //   initial = name[0].toLocaleLowerCase()
    // }

    user = await User.create({name, phone, password, self_id})

    return {
      code: 200,
      msg: '',
      user
    }
  }
}

export default new LoginService()