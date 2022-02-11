import { utils } from "../../../common/utils";
import { HandleEcraterAPI } from "../ecrater-middleware";

export const getConvertScript: HandleEcraterAPI = async function ({ rapi, username }) {
    let script = ''

    try {
        script = await utils.mongoDB(async ({ userConfig }) => {
            const userData = await userConfig.findOne({ name: username })
            if (!userData) return ''
            return userData.script || ''
        })
    } catch (error) {
        return rapi.error({ error, script })
    }

    return rapi.success({ script })
}

export const setConvertScript: HandleEcraterAPI = async function ({ rapi, username, body: { script } }) {
    try {
        await utils.mongoDB(async ({ userConfig }) => {
            await userConfig.updateOne({ name: username }, {
                $set: { script: script + '' }
            })
        })
        return rapi.success({})
    } catch (error) {
        return rapi.error({ error })
    }
}