import { ecrater } from "../../api/ecrater"
import { utils } from "../../common/utils"
import { Proxy, _socketEventCallback } from "../../declare"
import { ecraterRequest } from "../../request/ecrater-request"

export const setProxy: _socketEventCallback =
    async ({ data: { host, port, auth }, username, userStatus }) => {
        const proxy: Proxy = { host, port }
        const userInfo = { user: userStatus.user(), username }
        const { user } = userInfo

        if (user.status.prevent) return
        if (auth) proxy.auth = auth

        userStatus.proxy.settingUp(proxy).send()
        const isPassedProxy = await ecraterRequest.testProxy(proxy)

        if (isPassedProxy) {
            try {
                userStatus.proxy.valid(proxy).send()

                // lưu lại proxy trên db
                await utils.mongoDB(async ({ userConfig }) => {
                    const data = { name: username, proxy: proxy }
                    userConfig.updateOne({ name: username }, { $set: data }, {
                        upsert: true
                    })
                    const userData = await userConfig.findOne({ name: username })
                })

                // khởi tạo lại cookies 
                ecrater.initCookies(userInfo, userStatus, true)
            } catch (error) {
                console.log(error)
            }
        } else {
            userStatus.proxy.deathProxy(proxy).send()
        }
    }