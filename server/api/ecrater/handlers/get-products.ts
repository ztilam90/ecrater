import { utils } from '../../../common/utils';
import { ecraterRequest } from '../../../request/ecrater-request';
import { HandleEcraterAPI } from '../ecrater-middleware';

export const getProducts: HandleEcraterAPI = async ({ rapi, userInfo, body, username, userStatus, cookies, proxy }) => {
    let ecraterProducts = []
    let products = []

    // products from ecrater
    {
        const result = await userStatus.readField('list-products', () => userStatus.stackRequest(() => ecraterRequest.listProducts(proxy, cookies), true, 'listProducts'))
        const { error, products } = result
        if (error) throw error

        ecraterProducts = products || []
    }

    // products from mongodb
    {
        const userData = await utils.mongoDB(async ({ userConfig }) => await userConfig.findOne({ name: username }))
        if (!userData) return rapi.deathUser()
        products = (userData.products || [])
    }

    const productsMap = products.reduce((pre, { id }, index) => { pre[id] = index; return pre; }, {})


    return rapi.success([
        ...products,
        ...ecraterProducts.filter((product) => {
            const index = productsMap[product.id]
            if (index === undefined) {
                product.sync = false
                return true
            }
            products[index].sync = true
            return false
        })
    ])
}