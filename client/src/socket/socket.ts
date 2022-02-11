import { Socket } from "socket.io-client";
import { constants } from "../common/constants";
import { socketStatus } from "../context/SocketContext";
import { userSession } from "../context/UserContext";

export function applySocketIO(socket: Socket) {
    socket.on('disconnect', () => {
        if (constants.isDevMode) {
            setTimeout(socket.connect, 1000)
        } else {
            userSession.removeUser()
        }
    })

    socket.on('status', (status: any) => {
        constants.isDevMode && console.log(status)
        socketStatus.setStatus(status)
    })

    socket.on('connection', () => {
        console.log("connection")
    })

    socket.on('connect_failed', () => {
        console.log('error')
        userSession.removeUser()
    })

    socket.emit('status')
}

