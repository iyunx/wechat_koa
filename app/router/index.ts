import KoaRouter from 'koa-router'
import LoginController from '../controller/LoginController';
import UserRouter from './user'
import RoomRouter from './room'
import GroupRouter from './group'

const router = new KoaRouter();

router.get('/', (ctx) => {
  ctx.body = 'index'
})
router.post('/login', LoginController.login)
router.post('/sms', LoginController.sms)
router.post('/register', LoginController.register)

router.use(UserRouter.routes()).use(UserRouter.allowedMethods());
router.use(RoomRouter.routes()).use(RoomRouter.allowedMethods());
router.use(GroupRouter.routes()).use(GroupRouter.allowedMethods());

export default router