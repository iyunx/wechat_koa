import KoaRouter from 'koa-router'
import GroupController from '../../controller/GroupController';
import AuthMiddleware from '../../middleware/AuthMiddleware';

const router = new KoaRouter().prefix('/group');
// 中间件 验证token
router.use(AuthMiddleware)

// router.get('/', RoomController.index)
// router.get('/:id', RoomController.show)
// router.put('/:id', RoomController.update)
router.post('/store', GroupController.store)
// router.put('/:id/roomset', RoomController.roomset)
// router.post('/upload', RoomController.upload)

export default router