import { utils } from "../../../common/utils";
import { ecraterRequest } from "../../../request/ecrater-request";
import { ecrater } from "../ecrater";
import { HandleEcraterAPI } from "../ecrater-middleware";

export const addProducts: HandleEcraterAPI = async ({ rapi, username, userInfo, userStatus, cookies, body: { products } }) => {
    if (!Array.isArray(products)) return rapi.wrongData()
    const user = userStatus.user()
    if (user.status.addProducts) return rapi.error({ message: 'Không thể thêm quá nhiều list sản phẩm cùng lúc' })

    userStatus.addProducts.complete({ done: 0, total: products.length }).send()

    setTimeout(async () => {
        try {
            await userStatus.stackRequest(() => {
                delete user.preventAddProducts
                return ecraterRequest.addProducts(user.proxy, products, cookies, async (p) => {
                    p.error = p.error && (typeof p.error === 'string' ? p.error : (p.error as any).message) || ''

                    if (!p.error) {
                        try {
                            await utils.mongoDB(async ({ userConfig }) => {
                                await userConfig.updateOne({ name: username }, {
                                    $push: {
                                        products: p.product
                                    }
                                })
                            })
                        } catch (err) {
                            p.error = err.message
                        }
                    }

                    console.log([p.done, p.total, p.error])

                    userStatus.addProducts.complete({
                        done: p.done,
                        total: p.total,
                    }, p.error && { error: p.error, product: p.product }).send()
                }, () => {
                    return user.preventAddProducts
                })
            })
            delete user.preventAddProducts
        } catch (error) {
            if (error = 'login') {
                ecrater.initCookies(userInfo, userStatus, true)
            }
        }

        {
            userStatus.addProducts.clear().send()
            console.log('add done')
        }
    })

    return rapi.success({})
}
export const preventAddProducts: HandleEcraterAPI = async ({ rapi, userStatus }) => {
    const user = userStatus.user()
    if (user.status.addProducts) {
        user.preventAddProducts = true
    }
    return rapi.success()
}