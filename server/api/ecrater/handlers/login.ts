//@ts-nocheck
import { _handleRequest } from '../../../declare';
import { Router } from "express";
import { utils } from "../../../common/utils";
import { UserSessionList } from "../../../declare";
import { ecraterRequest } from '../../../request/ecrater-request';
import { io } from "../../../server";
import { UserStatus } from "../../../socket/user-status";
import { ecraterValidator } from "../../../validator/ecrater-validator";
import { ecrater } from "../ecrater";
import { config } from '../../../config';

let _userSession = {}

export const userSession: () => UserSessionList = () => _userSession

waitClearUserSession()

const router = Router()

export { router as LoginController };

router.post('/login', ecraterValidator.login, async (req, res) => {
    const data = await ecraterRequest.userLogin(req.body) as any
    // login thành công
    if (data.status === true) {
        const { username, password } = req.body
        let user = userSession()[username]

        // tạo id cho người dùng
        data.id = utils.randomString(10)

        if (user && user.password !== password) {
            const userStatus = UserStatus({ username, user })

            await utils.mongoDB(async ({ userConfig }) => {
                await userConfig.updateOne({ name: username }, { $unset: { cookies: '' } })
            })

            delete userSession().user
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

            userSession()[username] = user
        }

        // lưu trữ id vào list để auth
        user.sessionIds.push(data.id)

        data.user = {
            username: username,
        }
    }

    res.json(data).end()
})

function waitClearUserSession() {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() + 1)
    date.setUTCHours(0, 0, 0, 0)
    const time = date.getTime() - (new Date()).getTime() + 60000

    console.log('next time clear: ', [(new Date((new Date).getTime() + time).toUTCString())])

    setTimeout(() => {
        _userSession = {}
        waitClearUserSession()
    }, time)
}

// cái này dev mode dùng thôi nên không cần chú ý nhiều // dể đỡ phải login :V
if (config.isDevMode) {
    setTimeout(async () => {

        const username = 'abcdepot'
        const user = {
            sessionIds: ['xnhlpoxyqj'],
            status: {},
            password: '2Witro5TaV'
        } as any

        const userConfig = await utils.mongoDB(async ({ userConfig }) => {
            return await userConfig.findOne({ name: username })
        }) || {} as any

        const userStatus = UserStatus({ username, user })

        userStatus.proxy.valid(userConfig.proxy)
        userSession().abcdepot = user

        console.log('default: ', 'xnhlpoxyqj', 'abcdepot')

        if (userConfig.proxy) {
            if (!(await ecraterRequest.testProxy(userConfig.proxy))) {
                userStatus.proxy.deathProxy(userConfig.proxy)
            }
        } else {
            userStatus.proxy.requireProxy()
        }
    })
}


