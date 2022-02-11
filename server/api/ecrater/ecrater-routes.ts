import { Router } from 'express';
import { cookie } from 'express-validator';
import { UserStatus } from '../../socket/user-status';
import { UserInfo, _UserStatus } from './../../declare.d';
import { ecraterValidator } from './../../validator/ecrater-validator';
import { addProducts, preventAddProducts } from './handlers/add-products';
import { getConvertScript, setConvertScript } from './handlers/convert-script';
import { ecrater } from './ecrater';
import { ecraterAPIResult } from './ecrater-api-result';
import { authMiddleware } from './ecrater-middleware';
import { LoginController } from './handlers/login';
import { getProducts } from './handlers/get-products';
import { getProxy, setProxy } from './handlers/proxy-api';
import { deleteProducts } from './handlers/delete-products';
import { logoutEcrater } from './handlers/logout';

const c = authMiddleware
const router = Router()

router.use(LoginController)

router.get('/ecrater/products', c(getProducts))
router.get('/ecrater/proxy', c(getProxy, { cookies: false, proxy: false }))
router.post('/ecrater/proxy', ecraterValidator.proxy, c(setProxy, { cookies: false, proxy: false }))
router.get('/ecrater/script', c(getConvertScript, { cookies: false, proxy: false }))
router.post('/ecrater/script', c(setConvertScript, { cookies: false, proxy: false }))
router.post('/ecrater/products', c(addProducts))
router.post('/ecrater/products/prevent', c(preventAddProducts))
router.delete('/ecrater/products', c(deleteProducts))
router.post('/logout', logoutEcrater)


export { router as EcraterController };

