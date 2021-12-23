import { createHmac } from 'crypto'
import { pinyin } from 'pinyin-pro'
import redis from '../app/libs/redis'
import config from '../config'

const random = (len = 10, isStr = true) => {
  let str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefhijklmnopqrstuvwxyz0123456789'
  let num = '0123456789'
  let ret = ''
  let bool = isStr ? str : num
  let boolLen = isStr ? str.length : num.length
  for(let i = 0; i < len; i++) {
    ret += bool.charAt(Math.floor(Math.random() * boolLen))
  }
  return ret
}

const md5 = (pwd: string) => {
  const crypted = createHmac('sha512', config.pwd.secret).update(pwd).digest('hex');
  return crypted;
}

const ucwords = (str: string) => {
  let init = '#'
  let first = str[0]
  // 如果是汉字 escape() js原生函数 将汉字转换为字符集，汉字转换后必为 %u 开头
  if(escape(first).includes('%u')) {
    init = pinyin(first, { toneType: 'none' })[0]
  }
  // 如果是字母
  if(/[A-Za-z]/.test(first)) {
    init = first.toLocaleLowerCase()
  }
  return init
}

const getRedis = async (str: string, type = 'set') => {
  switch(type){
    case 'string':
      return await redis.get(str)
    case 'hash':
      return await redis.hgetall(str)
    case 'list':
      return await redis.lrange(str, 0, -1)
    case 'set':
      return await redis.smembers(str)
    case 'zset':
      return await redis.zrange(str, 0, -1)
  }
}

const isEquar = (arr1: number[], arr2: number[]) => {
  let a = arr1.sort();
  let b = arr2.sort();
  if(a.length !== b.length) return false
  for(let i = 0; i < a.length; i ++) {
    if(a[i] !== b[i]) return false
  }
  return true
}

export {
  random,
  md5,
  ucwords,
  getRedis,
  isEquar
}