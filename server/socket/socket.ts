import { ecrater } from "../api/ecrater";
import { userSession } from "../api/ecrater-api";
import { utils } from "../common/utils";
import { config } from "../config";
import { Proxy, UserInfo, _socket, _socketEventCallback, _UserStatus } from "../declare";
import { ecraterRequest } from "../request/ecrater-request";
import { io, _socketIO } from "../server";
import { addProducts } from "./events/add-products";
import { getProducts } from "./events/get-products";
import { setProxy } from "./events/set-proxy";
import { UserStatus } from "./user-status";

export function applySocketIO(io: _socketIO) {
    if (config.isDevMode) {
        io.use((socket, next) => {
            if (!config.isDevMode && socket.handshake.headers.origin) return socket.disconnect()
            return next()
        })
    }

    io.on('connection', (socket) => {
        if (!checkAuthIO(socket)) return socket.disconnect()

        // thêm vào group, giúp các client đồng bộ trạng thái khi người dùng đồng bộ với nhau
        socket.join(socket.handshake.auth.username)

        addSocketEvents(socket, 'status', ({ userStatus }) => userStatus.send())
        addSocketEvents(socket, 'setProxy', setProxy)
        addSocketEvents(socket, 'getProducts', getProducts)
        addSocketEvents(socket, 'addProducts', addProducts)
    })
}


function checkAuthIO(socket) {
    if (!socket.handshake.auth) return
    const { username, id } = socket.handshake.auth
    const user = userSession[username]
    if (!user) return
    if (user.sessionIds.findIndex(v => v === id) === -1) return
    return true
}

function checkAuthSocket(username: string, socket: _socket) {
    const user = userSession[username]
    if (!user) return false
    return UserStatus({ username, user })
}

function addSocketEvents(socket, name: any, callback: _socketEventCallback, validator?: any) {
    socket.on(name, async (data) => {
        console.log('event: ', name)
        const username = socket.handshake.auth.username
        const userStatus = checkAuthSocket(socket.handshake.auth.username, socket)
        if (!userStatus) {
            io.to(username).disconnectSockets()
        } else {
            if (userStatus.user().status.initCookies !== undefined) return
            try {
                await callback({ userStatus, data: data || {}, username })
            } catch (error) {
                if (error === 'proxy') {
                    userStatus.proxy.deathProxy(userStatus.user().status.proxy).send()
                    try {
                        await utils.mongoDB(async ({ userConfig }) => {
                            await userConfig.updateOne({ name: username }, {
                                $unset: { proxy: '' }
                            })
                        })
                    } catch (error) { }
                } else if (error === 'login') {
                    delete userSession[username]
                    userStatus.disconnect()
                    // xóa tất cả cookie khỏi db
                    try {
                        await utils.mongoDB(async ({ userConfig }) => {
                            await userConfig.updateOne({ name: username }, {
                                $unset: { cookies: '' }
                            })
                        })
                    } catch (error) { }
                }


                console.log(error)
                return false
            }
        }
    })
}