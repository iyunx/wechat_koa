import KoaRouter from 'koa-router'
import ChatController from '../../controller/ChatController';
import RoomController from '../../controller/RoomController';
import AuthMiddleware from '../../middleware/AuthMiddleware';

const router = new KoaRouter().prefix('/room');
// 中间件 验证token
router.use(AuthMiddleware)

router.get('/', RoomController.index)
router.get('/:id', RoomController.show)
router.put('/:id', RoomController.update)
router.post('/store', RoomController.store)
router.put('/:id/roomset', RoomController.roomset)
router.post('/upload', RoomController.upload)

export default router