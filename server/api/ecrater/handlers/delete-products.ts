import { utils } from "../../../common/utils";
import { ecraterRequest } from "../../../request/ecrater-request";
import { HandleEcraterAPI } from "../ecrater-middleware";

export const deleteProducts: HandleEcraterAPI = async ({ userStatus, userInfo, username, cookies, proxy, rapi, body: { ids } }) => {
    const { user } = userInfo
    if (ids.length === 0) return rapi.error('Dữ liệu không hợp lệ')
    if (user.status.deleteProducts) return rapi.error('Không thể xóa quá nhiều sản phẩm cùng lúc')
    userStatus.deleteProducts.delete({ done: 0, total: ids.length, error: 0 }).send()
    rapi.success()
    userStatus.stackRequest(() => ecraterRequest.deleteProducts(ids, cookies, proxy, (data, err) => {
        userStatus.deleteProducts.delete(data).send()
        console.log('err: ', err)
        if (!err) {
            utils.mongoDB(async ({ userConfig }) => {
                await userConfig.updateOne({ name: username }, {
                    $pull: { products: { id: data.id } }
                })
            })
        }
    })).finally(() => {
        userStatus.deleteProducts.clear().send()
    })

}