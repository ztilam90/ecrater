import { utils } from '../../../common/utils';
import { ecraterRequest } from '../../../request/ecrater-request';
import { ecrater } from '../ecrater';
import { HandleEcraterAPI } from '../ecrater-middleware';

export const setProxy: HandleEcraterAPI = async ({ rapi, userInfo, body: { proxy }, username, userStatus }) => {

    const isPassedProxy = await ecraterRequest.testProxy(proxy)
    console.log(proxy)

    if (!isPassedProxy) {
        return rapi.error('Proxy không ổn định')
    } else {
        userStatus.proxy.valid(proxy).send()
        ecrater.initCookies(userInfo, userStatus)
        utils.mongoDB(async ({ userConfig }) => await userConfig.updateOne({ name: username }, {
            $set: { proxy }
        }))

        return rapi.success()
    }
}

export const getProxy: HandleEcraterAPI = async ({ rapi, userInfo }) => {
    return rapi.success(userInfo.user.proxy || null)
}