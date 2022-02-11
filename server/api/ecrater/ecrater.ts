import { utils } from "../../common/utils"
import { config } from "../../config"
import { UserInfo, _UserStatus } from "../../declare"
import { ecraterRequest } from "../../request/ecrater-request"
import { io } from "../../server"
import { UserStatus } from "../../socket/user-status"
import { userSession } from "./handlers/login"

export const ecrater = {
    initCookies: async (userInfo: UserInfo, userStatus?: _UserStatus, isTestCookie = false) => {
        const { username, user } = userInfo
        if (!userStatus) userStatus = UserStatus(userInfo)

        try {
            const userData = await utils.mongoDB(async ({ userConfig }) => await userConfig.findOne({ name: username }))
            const { cookies } = userData
            if (Array.isArray(cookies)
                && cookies.length === config.maxCookiesUsage
                && (!isTestCookie || await ecraterRequest.testCookie(cookies[0], user.status.proxy))) {
                return cookies
            }
        } catch (error) { }

        userStatus.initCookies.initializing({ done: 0, total: config.maxCookiesUsage }).send()

        // request để lấy cookie
        let { status, cookies, error } = await ecraterRequest.initCookies({
            username: username,
            password: user.password
        }, user.proxy, (data) => {
            //request thành công
            userStatus.initCookies.initializing(data).send()
        })

        // lỗi proxy hoặc login sai
        if (status === false) {
            const unsetList = { cookie: '' } as any
            if (error === 'proxy') {
                userStatus.initCookies.clear().proxy.requireProxy().send()
                unsetList.proxy = ''
            } else if (error === 'login') {
                delete userSession()[username]
                io.to(username).disconnectSockets()
            }

            // xóa tất cả cookie khỏi db
            await utils.mongoDB(async ({ userConfig }) => {
                await userConfig.updateOne({ name: username }, {
                    $unset: unsetList
                })
            })

            return false

        } else {

            // lưu tất cả cookie vào db 
            await utils.mongoDB(async ({ userConfig }) => {
                await userConfig.updateOne({ name: username }, {
                    $set: {
                        name: username,
                        proxy: user.status.proxy,
                        cookies: cookies
                    }
                }, { upsert: true })
            })

            // đẩy thông báo về cho người dùng
            userStatus.initCookies.clear().send()

            return cookies
        }

    },
}