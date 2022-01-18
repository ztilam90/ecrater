import { Socket } from "socket.io"
import { utils } from "../common/utils"
import { UserInfo, _socket } from "../declare"
import { io } from "../server"

export function UserStatus(u: UserInfo, socket?: _socket) {
    const { username, user } = u
    function setStatus(key) {
        return function (v?) {
            if (v === undefined) delete user.status[key]
            else user.status[key] = v
            return result
        }
    }

    const result = {
        user() { return user },
        initCookies: (() => {
            const set = setStatus('initCookies')
            return {
                initializing: (status: { done: number, total: number }) => set(status),
                clear: () => set()
            }
        })(),
        proxy: (() => {
            const set = setStatus('proxy')
            return {
                settingUp: (proxy) => set({
                    status: 'Đang thiết lập',
                    prevent: true,
                    isLoading: true,
                    proxy: proxy
                })
                ,
                deathProxy: (proxy) => set({
                    error: 'Proxy không ổn định',
                    proxy: proxy
                }),
                requireProxy: () => set({ status: 'Vui lòng cấu hình proxy' }),
                valid: (proxy) => set(proxy)
            }
        })(),
        addProducts: (function () {
            const set = setStatus('addProducts')
            return {
                complete(data?: { done: number, total: number, [n: string]: any } | undefined, failedItem?: any) {
                    if (!data) {
                        if (!user.status.addProducts) return result
                        const { done, total } = user.status.addProducts
                        if (done === undefined && total === undefined) return result
                        data = user.status.addProducts
                    }

                    if (failedItem) {
                        if (!Array.isArray(data.failedItems)) data.failedItems = []
                        data.failedItems.push(failedItem)
                    }
                    return set({ ...data })
                },
                clear: () => set()
            }
        })(),
        getProducts: (() => {
            const set = setStatus('getProducts')

            return {
                sendProducts: (products) => {
                    set()
                    result.send({ getProducts: products })
                },
                loading: () => result.send({ getProducts: { status: 'Đang xử lí' } }),
            }
        })(),
        startRequest(name = true as string | boolean) {
            user.status.request = name || true
        },
        isPreventRequest() {
            return user.status.preventRequest !== undefined
        },
        waitLastRequest() {
            if (user.status.request) {
                if (!user.status.preventRequest)
                    user.status.preventRequest = new Promise((resolve) => {
                        user.status.resolveRequest = () => {
                            result.doneRequest()
                            resolve('')
                        }
                    })
                return user.status.preventRequest
            }
            return
        },
        doneRequest() {
            const { resolveRequest } = user.status
            delete user.status.request
            delete user.status.preventRequest
            delete user.status.resolveRequest
            if (resolveRequest) resolveRequest()
        },
        send(items = {}) {
            io.to(username).emit('status', { ...user.status, ...items })
            return result
        },
        sendSocket(items = {}) {
            socket && socket.emit('status', { ...user.status, ...items })
            return result
        },
        disconnect() {
            io.to(username).disconnectSockets()
        },
        question(question, delay = 10000) {
            return new Promise<any>((resolve) => {
                const questionId = utils.randomString()
                let isDeathSocket = false

                socket.on('disconnect', () => {
                    isDeathSocket = true
                    resolve('')
                })

                setTimeout(() => {
                    if (!isDeathSocket) resolve('')
                }, delay)

                socket.on(questionId, resolve)
                socket.emit('question', { id: questionId, question: question })
            })
        }
    }
    return result
}