import Koa from 'koa'
import router from './router'
import KoaStatic from 'koa-static'
import KoaBody from 'koa-body';
import path from 'path'
import koaCors from '@koa/cors'
import { Server } from 'socket.io'
import http from 'http'
import socket from './libs/socket'
import dotenv from 'dotenv'
// 默认配置，自动获取根目录的.env内容
dotenv.config({path: path.join(__dirname, '..', '/.env')});

const app = new Koa();
const httpServer = http.createServer(app.callback())
const io = new Server(httpServer)

// 错误处理
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err: any) {
    switch(err.status){
      case 401:
        ctx.response.status = 401
        ctx.body = err.message
        break;
      case 400:
        ctx.response.status = 400
        ctx.body = err.message
        break;
      default:
        console.log(err)
        ctx.response.status = 500
        return ctx.body = err.message
        break;
    }
  }
})

socket(io)

app
  .use(koaCors({
    // 后端可设置 ctx.set('Authorization', token)
    exposeHeaders: ['Authorization']
  }))
  .use(KoaStatic(path.join(__dirname, '..', 'uploads')))
  .use(KoaBody({
    multipart: true,
    formidable: {
      uploadDir: path.join(__dirname, '..', 'uploads')
    }
  }))
  .use(router.routes())
  .use(router.allowedMethods())

const run = (port: number) => {
  httpServer.listen(port)
}

export default run