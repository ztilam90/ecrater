import { UserInfo, _UserStatus } from "../../declare"
import { UserStatus } from "../../socket/user-status"
import { ecrater } from "./ecrater"
import { ecraterAPIResult } from "./ecrater-api-result"
import { userSession } from "./handlers/login"

export function authMiddleware(callback: HandleEcraterAPI, config = { cookies: true, proxy: true }
) {
    return async function (req, res) {
        const rapi = ecraterAPIResult(res)

        const authorizationStr = req.headers.authorization
        if (!authorizationStr) return rapi.authorization()

        const [username, sessionID] = authorizationStr.split(':')
        if (!sessionID) return rapi.authorization()
        const user = userSession()[username]
        if (!user || !sessionID || user.sessionIds.findIndex((v) => v == sessionID) === -1) return rapi.authorization()

        const userInfo = { username, user }
        const userStatus = UserStatus(userInfo)
        const params: ecraterAPIParams = { userInfo, userStatus, username, body: req.body, proxy: user.proxy, rapi }


        if (user.status.initCookies) return rapi.initCookies()
        if (!config) config = {} as any

        if (config.cookies) {
            if (!user.proxy) return rapi.requrieProxy()
            params.cookies = await ecrater.initCookies(userInfo)
            if (!params.cookies) return rapi.deathUser()
        }

        if (config.proxy) {
            if (user.status.proxy && user.status.proxy.error === -1) {
                return rapi.requrieProxy()
            }
            params.proxy = user.proxy
        }

        try {
            await callback(params)

            if (config.proxy) {
                if (user.status.proxy) {
                    delete user.status.proxy
                    userStatus.send()
                }
            }

        } catch (error) {
            error = typeof error === 'string' ? error : error.message
            if (error === 'login') {
                ecrater.initCookies(userInfo, undefined, true)
                return rapi.error('Lỗi khi tạo cookies')
            } else if (error === 'proxy') {
                console.log(error)
                if (!user.status.proxy) {
                    userStatus.proxy.deathProxy().send()
                }
                return rapi.proxy()
            }
            return rapi.error(error)
        }
    }
}

type ecraterAPIParams = {
    userInfo: UserInfo,
    username: string,
    rapi: ReturnType<typeof ecraterAPIResult>,
    body: any,
    userStatus: _UserStatus,
    cookies?: any,
    proxy?: any,
    sessionID?: number
}

export type HandleEcraterAPI = (params: ecraterAPIParams) => any | void