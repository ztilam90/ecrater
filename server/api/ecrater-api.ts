//@ts-nocheck
import { Router } from "express";
import { utils } from "../common/utils";
import { UserSessionList } from "../declare";
import { ecraterRequest } from '../request/ecrater-request';
import { io } from "../server";
import { UserStatus } from "../socket/user-status";
import { ecraterValidator } from "../validator/ecrater-validator";
import { ecrater } from "./ecrater";


export const userSession: UserSessionList = {}

const router = Router()

export { router as EcraterController };

router.post('/login', ecraterValidator.login, async (req, res) => {
    const data = await ecraterRequest.userLogin(req.body) as any
    // login thành công
    if (data.status === true) {
        const { username, password } = req.body
        let user = userSession[username]

        // tạo id cho người dùng
        data.id = utils.randomString(10)

        if (user && user.password !== password) {
            const userStatus = UserStatus({ username, user })
            await userStatus.preventLastRequest()

            await utils.mongoDB(async ({ userConfig }) => {
                await userConfig.updateOne({ name: username }, { $unset: { cookies: '' } })
            })

            delete userSession.user
            io.to(username).disconnectSockets()
            user = undefined
        }

        // khởi tạo dữ liệu cho người dùng chưa đăng nhập
        if (!user) {

            user = { sessionIds: [], status: {}, password } as any
            const userStatus = UserStatus({ username, user })

            /**
             * lấy ra những cấu hình của người dùng
             *  gồm có: proxy
             */
            const userConfig = await utils.mongoDB(async ({ userConfig }) => {
                return await userConfig.findOne({ name: username })
            }) || {} as any

            if (userConfig.proxy) {
                if (await ecraterRequest.testProxy(userConfig.proxy)) {
                    userStatus.proxy.valid(userConfig.proxy)
                    ecrater.initCookies({ username, user }, userStatus, true)
                } else {
                    userStatus.proxy.deathProxy(userConfig.proxy)
                }
            } else {
                userStatus.proxy.requireProxy()
            }

            userSession[username] = user
        }

        // lưu trữ id vào list để auth
        user.sessionIds.push(data.id)

        data.user = {
            username: username,
        }
    }

    res.json(data).end()
})