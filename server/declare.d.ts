import { Router } from "express"
import { UserStatus } from "./socket/user-status"

export type User = {
    username: string
    password: string
}

export type Proxy = {
    host: string,
    port: string,
    auth?: string
}

export type UserSession = {
    password?: string
    sessionIds: string[],
    requests: any[],
    proxy?: Proxy,
    preventAddProducts: boolean,
    status?: {
        [n: string]: any
    }
}

export type UserSessionList = {
    [n: string]: UserSession
}

export type UserInfo = {
    username: string,
    user: UserSession
}

export type _UserStatus = ReturnType<typeof UserStatus>

export type _socketEventCallback = (v: { userStatus: _UserStatus, data: any, username: string }) => any

export type _socket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
    T extends (...args: any) => Promise<infer R> ? R : any


export type _handleRequest = (req?: Request, res?: Response) => any