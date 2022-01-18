import { ecrater } from "../../api/ecrater";
import { userSession } from "../../api/ecrater-api";
import { utils } from "../../common/utils";
import { _socketEventCallback } from "../../declare";
import { ecraterRequest } from "../../request/ecrater-request";


export const getProducts: _socketEventCallback =
    async ({ userStatus, username, data: { isReload } }) => {
        const userInfo = { user: userStatus.user(), username }
        if (userStatus.user().status.getProducts) return
        userStatus.getProducts.loading()


        const cookies = await ecrater.initCookies(userInfo, userStatus)
        if (!cookies) return

        // main code
        let status = true, products = { ecrater: [], server: [] }, error = ''

        // lấy sản phẩm trực tiếp từ web hoặc Database
        if (isReload === true) {
            await getEcraterProducts(cookies)
        } else {
            let userData

            try {
                userData = await utils.mongoDB(({ userConfig }) => userConfig.findOne({ name: username }))
            } catch (error) { error = error }

            if (!userData) userStatus.disconnect()

            if (userData.ecraterProducts) {
                products = userData.ecraterProducts
            } else {
                await getEcraterProducts(cookies)
            }
        }

        try {
            products.server = await utils.mongoDB(async ({ userConfig }) => {
                const userConfigData = await userConfig.find({ name: username }) as any
                return userConfigData ? (userConfigData.products || []) : []
            })
        } catch (error) { error = error }

        if (status === true && !error) {
            return userStatus.getProducts.sendProducts({ products })
        } else {
            return userStatus.getProducts.sendProducts({ error })
        }

        async function getEcraterProducts(cookies) {
            try {
                userStatus.startRequest('list products')
                const result = await ecraterRequest.listProducts(userInfo.user.status.proxy, cookies)
                userStatus.doneRequest()

                status = result.status
                products.ecrater = result.products
                error = result.error || ''

                await utils.mongoDB(({ userConfig }) => userConfig.updateOne({ name: username }, {
                    $set: {
                        ecraterProducts: products
                    }
                }))
            } catch (err) {
                error = err
            }

        }
    }