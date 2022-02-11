import { userSession } from "../api/ecrater/handlers/login";
import { utils } from "../common/utils";
import { config } from "../config";
import { _socket, _socketEventCallback } from "../declare";
import { io, _socketIO } from "../server";
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

        socket.addListener('status', () => {
            const username = socket.handshake.auth.username
            const userStatus = checkAuthSocket(socket.handshake.auth.username, socket)
            if (!userStatus) {
                io.to(username).disconnectSockets()
            } else {
                socket.emit('status', userStatus.user().status)
            }
        })
    })
}


function checkAuthIO(socket) {
    if (!socket.handshake.auth) return
    const { username, id } = socket.handshake.auth
    const user = userSession()[username]
    if (!user) return
    if (user.sessionIds.findIndex(v => v === id) === -1) return
    return true
}

function checkAuthSocket(username: string, socket: _socket) {
    const user = userSession()[username]
    if (!user) return false
    return UserStatus({ username, user }, socket)
}

