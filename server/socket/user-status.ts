import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import path from "path";
import { ecrater } from "../api/ecrater/ecrater";
import { userSession } from "../api/ecrater/handlers/login";
import { utils } from "../common/utils";
import { config } from "../config";
import { UserInfo, _socket } from "../declare";
import { io, _mainScriptDir } from "../server";

export function UserStatus(u: UserInfo, socket?: _socket) {
    const { username, user } = u
    function setStatus(key) {
        return {
            set(v?) {
                if (v === undefined) delete user.status[key]
                else user.status[key] = v
                return result
            },
            get() {
                return user.status[key]
            }
        }
    }

    const result = {
        user() { return user },
        initCookies: (() => {
            const { set, get } = setStatus('initCookies')
            return {
                initializing: (status: { done: number, total: number }) => set(status),
                clear: () => set()
            }
        })(),
        proxy: (() => {
            const { set, get } = setStatus('proxy')
            return {
                deathProxy: (proxy = user.proxy) => {
                    user.proxy = proxy
                    return set({ message: 'Proxy không ổn định', error: 1 })
                },
                requireProxy: () => set({ message: 'Vui lòng cấu hình proxy', error: -1 }),
                valid: (proxy = user.proxy) => {
                    user.proxy = proxy
                    return set()
                }
            }
        })(),
        addProducts: (function () {
            const { set, get } = setStatus('addProducts')
            return {
                complete(data?: { done: number, total: number, [n: string]: any } | undefined, failedItem?: any) {
                    data = { ...get(), ...data }
                    if (failedItem) {
                        if (!Array.isArray(data.failedItems)) data.failedItems = []
                        data.failedItems.push(failedItem)
                    }
                    set(data)
                    return result
                },
                clear: () => set()
            }
        })(),
        deleteProducts: (() => {
            const { set, get } = setStatus('deleteProducts')

            return {
                delete: (data) => {
                    return set(data)
                },
                clear: () => set(),
            }
        })(),
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
        },
        stackRequest<T>(action: () => Promise<T>, delay = true, name = ''): Promise<T> {
            async function execute() {
                if (!user.requests || user.requests.length === 0) return
                const { action, delay, name, resolve, reject } = user.requests[0]

                if (!userSession()[username]) {
                    reject('login')
                    delete user.requests
                    return
                }

                try {
                    const result = await action()
                    if (name) {
                        user.requests = user.requests.filter(({ name: nameLoopItem, resolve }) => {
                            if (name === nameLoopItem) {
                                resolve(result)
                                return false
                            }
                            return true
                        })
                    } else {
                        user.requests.shift()
                        resolve(result)
                    }
                } catch (error) {
                    if (name) {
                        user.requests = user.requests.filter(({ name: nameLoopItem, reject }) => {
                            if (name === nameLoopItem) {
                                reject(error)
                                return false
                            }
                            return true
                        })
                    } else {
                        user.requests.shift()
                        reject(error)
                    }
                }


                if (user.requests.length === 0) {
                    delete user.requests
                } else {
                    if (delay) utils.delay(config.delayRequest)
                    execute()
                }
            }

            return new Promise((resolve, reject) => {
                if (!user.requests) user.requests = []

                user.requests.push({ action, delay, name, resolve, reject })

                if (user.requests.length === 1) {
                    execute()
                }
            })
        },
        async getCookies() {
            const cookies = await ecrater.initCookies(u, result, false)
            if (!cookies) throw 'login'
            return cookies
        },
        async readField(field, promiseOrCallback, time = 3000) {
            const pathField = path.join(_mainScriptDir, 'cache', username, field)
            if (existsSync(pathField)) {
                return JSON.parse(readFileSync(pathField, { encoding: 'utf-8' })).data
            } else {
                const data = typeof promiseOrCallback === 'function' ? await promiseOrCallback() : await promiseOrCallback
                if (!data) return data
                return result.writeField(field, data, time)
            }
        },
        clearField(field) {
            const pathField = path.join(_mainScriptDir, 'cache', username, field)
            if (existsSync(pathField)) {
                unlinkSync(pathField)
            }
        },
        writeField(field, data = {}, time = 3000) {
            const userCachePath = path.join(_mainScriptDir, 'cache', username)
            const pathFieldPath = path.join(userCachePath, field)
            if (!existsSync(userCachePath)) mkdirSync(path.join(userCachePath), { recursive: true })
            writeFileSync(pathFieldPath, JSON.stringify({ data }), { encoding: 'utf-8' })
            setTimeout(() => {
                try {
                    result.clearField(field)
                } catch (error) { }
            }, time)

            return data
        }
    }

    return result
}