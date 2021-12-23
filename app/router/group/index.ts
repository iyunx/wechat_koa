import KoaRouter from 'koa-router'
import GroupController from '../../controller/GroupController';
import AuthMiddleware from '../../middleware/AuthMiddleware';

const router = new KoaRouter().prefix('/group');
// 中间件 验证token
router.use(AuthMiddleware)

router.get('/:id', GroupController.show)
router.post('/store', GroupController.store)

export default router