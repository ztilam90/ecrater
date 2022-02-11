import { check } from "express-validator";

export const ecraterValidator = {
    login: [
        check('username').notEmpty(),
        check('password').notEmpty()
    ],
    proxy: [
        check('proxy.host').notEmpty(),
        check('proxy.port').notEmpty()
    ],
    deleteProducts: [
        check('ids').isArray()
    ]
}