import KoaRouter from 'koa-router'
import GroupController from '../../controller/GroupController';
import AuthMiddleware from '../../middleware/AuthMiddleware';

const router = new KoaRouter().prefix('/group');
// 中间件 验证token
router.use(AuthMiddleware)

router.get('/:id', GroupController.show)
router.get('/:id/index', GroupController.index)
router.post('/store', GroupController.store)
router.post('/update/:id', GroupController.update)
router.put('/:id/num', GroupController.groupUserNum)
router.put('/:id/join', GroupController.joinGroup)
router.post('/audio', GroupController.audio)
router.post('/video', GroupController.video)

export default router