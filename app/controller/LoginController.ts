import type { Context, Next } from "koa";
import { Rules } from 'async-validator';
import { err, success, validator } from '../libs'
import LoginService from '../service/LoginService';
import redis from '../libs/redis'
import { sign } from "../libs/jwt";

const rules: Rules = {
  phone: [
    {type: 'string', required: true, message: '手机号必填'},
    { 
      asyncValidator(rule, value) {
        return new Promise((resolve, reject) => {
          if(/^1[3-9]\d{9}/.test(value)) {
            resolve()
          }
          reject('手机号不正确')
        })
      },
    },
  ],
  password: { type: 'string', required: true, message: '密码必填'}
}

class LoginController {

  async login(ctx: Context, next: Next) {
    
    let { error } = await validator(ctx, rules)
  
    if(error && !Array.isArray(error)) return err(ctx, error.message)

    // 查询数据库的手机，找到账户，对比密码
    let data = await LoginService.login(ctx)

    let user = JSON.parse(JSON.stringify(data))
    Reflect.deleteProperty(user, 'password')
    Reflect.deleteProperty(user, 'created_at')
    Reflect.deleteProperty(user, 'updated_at')
    const token = await sign({
      id: user.id,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
    })
    ctx.set('Authorization', token as string)
    success(ctx, user)
  }

  async register(ctx: Context, next: Next){
    const { name, phone, password, sms } = ctx.request.body;

    let ret = await redis.get('code-' + phone)
    if(!ret) return err(ctx, '验证码已过期')
    if(ret != sms) return err(ctx, '验证码不正确')

    const data = await LoginService.register(ctx)
    
    let user = JSON.parse(JSON.stringify(data))
    Reflect.deleteProperty(user, 'password')
    Reflect.deleteProperty(user, 'created_at')
    Reflect.deleteProperty(user, 'updated_at')

    const token = await sign({id: user.id, name: user.name, self_if: user.self_id, phone: user.phone})
    ctx.set('Authorization', token as string)
    success(ctx, user)
  }
  
  async sms(ctx: Context, next: Next){
    const rule: Rules = {
      phone: rules.phone
    }
    let { data, error } = await validator(ctx, rule)
    if(error && !Array.isArray(error)) return err(ctx, error.message)
    
    // 发送验证码 阿里云短信发送
    // let code = random(6, false)
    let sms = '8888'
    // const ret = await sms.main([phone, '爱阆中', 'SMS_1859', code])
    // if(ret.body.code != 'OK') {
    //   return err(ctx, ret.body.message)
    // }

    redis.set('code-' + data.phone, sms)
    redis.expire('code-' + data.phone, 60 * 5)
    success(ctx, null, '短信已发送，请查收')
  }
}

export default new LoginController()