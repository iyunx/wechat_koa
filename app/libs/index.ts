import Schema, { Rules, Values } from "async-validator"
import type { Context } from "koa"

const success = (ctx: Context, data?: object | null, msg = 'success', code = 200) => {
  ctx.body = {
    code,
    msg,
    data
  }
}

const err = (ctx: Context, msg: string | [] = 'error', code = 400) => {
  ctx.response.status = code
  ctx.body = {
    code,
    msg
  }
}

type err = {
  fieldValue: string | number,
  field: string,
  message: string
}
/**
 * 验证函数封装
 * @param ctx Context
 * @param rules 
 * rules 示例：const rules = { name: [ {type: string, require: true, message: '不能为空'}, {} ], password: {} }
 * @returns 
 */
const validator = <T extends Values> (ctx: Context, rules: Rules, flag = false): Promise<{ data: T, error?: err | err[] }> => {
  let data = {} as T
  if(ctx.method === 'GET') {
    for(let [k, v] of Object.entries(ctx.query)) {
      // @ts-ignore
      data[k] = v
    }
  }
  if(ctx.method === 'POST') {
    data = ctx.request.body
  }
  const valid = new Schema(rules)
  return valid.validate(data)
    .then(() => {
      return {
        data
      }
    })
    .catch((err) => {
      let errors: err[] = err.errors
      if(flag) {
        return {
          data,
          error: errors
        }
      } else {
        return {
          data,
          error: errors[0]
        }
      }
    })
}

export {
  success,
  err,
  validator
}