import { check } from "express-validator";

export const ecraterValidator = {
    login: [
        check('username').notEmpty(),
        check('password').notEmpty()
    ]
}