import { ecraterAPIResult } from "../ecrater-api-result";
import { userSession } from "./login";

export const logoutEcrater = async (req, res) => {
    const rapi = ecraterAPIResult(res)

    const authorizationStr = req.headers.authorization
    if (!authorizationStr) return rapi.authorization()

    const [username, sessionID] = authorizationStr.split(':')
    if (!sessionID) return rapi.authorization()
    const user = userSession()[username]
    const sessionIndex = user.sessionIds.findIndex((v) => v == sessionID)
    console.log('sessionIndex', sessionIndex)
    if (!user || !sessionID || sessionIndex === -1) return rapi.authorization()

    user.sessionIds.splice(sessionIndex, 1)
    return rapi.success()
}