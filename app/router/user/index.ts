import KoaRouter from 'koa-router'
import UserController from '../../controller/UserController';
import AuthMiddleware from '../../middleware/AuthMiddleware';

const router = new KoaRouter().prefix('/user');
// 中间件 验证token
router.use(AuthMiddleware)

router.get('/', UserController.index)
router.get('/search', UserController.search)
router.get('/remind', UserController.remindIndex)
router.get('/:uid/remind/:id', UserController.remindShow)
router.get('/:id', UserController.show)
router.post('/store', UserController.store)
router.post('/contact', UserController.contact)

export default router