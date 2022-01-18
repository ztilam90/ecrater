import { ecrater } from "../../api/ecrater";
import { utils } from "../../common/utils";
import { _socketEventCallback } from "../../declare";
import { ecraterRequest } from "../../request/ecrater-request";

export const addProducts: _socketEventCallback =
    async function ({ userStatus, username, data: products }) {
        if (!Array.isArray(products)) return
        const user = userStatus.user()
        const userInfo = { user, username }
        const cookies = await ecrater.initCookies(userInfo)
        if (!cookies) return

        // const productsMap: any[] = (await utils.mongoDB(async ({ userConfig }) => {
        //     const userData = await userConfig.findOne({ name: username })
        //     if (!userData) return []
        //     const { products } = userData
        //     if (!Array.isArray(products)) return []
        //     return products
        // })).reduce((pre, cur) => {
        //     pre[cur.title] = cur.id
        //     return pre
        // }, {})
        // console.log(['products map', productsMap])

        // let duplicateProducts = products.filter((p) => {
        //     return productsMap[p.title]
        // })

        // let deleteList = []

        // if (duplicateProducts.length !== 0) {
        //     console.log('wait question')
        //     deleteList = await userStatus.question({
        //         question: 'Chọn sản phẩm để thay thế?'
        //     }, 100000)
        // }

        // if (!Array.isArray(deleteList)) deleteList = []

        await userStatus.waitLastRequest()
        userStatus.startRequest('add_products')
        userStatus.addProducts.complete({ done: 0, total: products.length }).send()
        let error
        try {
            await ecraterRequest.addProducts(user.status.proxy, products, cookies, async (p) => {
                p.error = p.error && (typeof p.error === 'string' ? p.error : (p.error as any).message) || ''
                console.log([p.done, p.total])
                userStatus.addProducts.complete({
                    done: p.done,
                    total: p.total,
                }, p.error && { error: p.error, product: p.product }).send()

                await utils.mongoDB(async ({ userConfig }) => {
                    await userConfig.updateOne({ name: username }, {
                        $push: {
                            products: p.product
                        }
                    })
                })
            })
        } catch (err) {
            error = err
        }
        userStatus.doneRequest()
        userStatus.addProducts.clear().send()
        if (error) throw error
    }