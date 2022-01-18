import { Socket } from "socket.io-client";
import { socketStatus } from "../context/SocketContext";
import { userSession } from "../context/UserContext";

export const socketAction = {
    setProxy(proxy: { host: string, port: string, auth?: string }) {
        userSession.socket.emit('setProxy', proxy)
    },
    getProducts() {
        userSession.socket.emit('getProducts')
    },
    uploadProducts(products) {
        userSession.socket.emit('addProducts', products)
    }
}

export function applySocketIO(socket: Socket) {
    socket.on('disconnect', () => {
        userSession.removeUser()
        console.log('disconnect')
    })

    socket.on('status', (status) => {
        console.log(status)
        socketStatus.setStatus(status)
    })

    socket.on('connection', () => {
        console.log("connection")
    })

    socket.on('connect_failed', () => {
        console.log('error')
        userSession.removeUser()
    })
    socket.onAny((...args) => {
        console.log([args])
    })
    socket.emit('status')
}

