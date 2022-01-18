// @ts-nocheck
import React from "react"
import { io, Socket } from "socket.io-client"
import { User } from ".."
import { applySocketIO } from "../socket/socket"

export const UserContext = React.createContext({} as typeof userSession)

export const userSession: {
    user: User,
    id: string,
    proxy?: {
        host: string,
        port: string,
        auth?: string
    },
    socket: _socket
    setUser: (user: User, sessionID: string, proxy: any) => void,
    removeUser: () => void
} = getSession() as any

export class UserProvider extends React.Component {
    constructor(props) {
        super(props)
        setSocket()
        userSession.setUser = (async (user: User, id: string, proxy: any) => {
            userSession.user = user;
            userSession.id = id
            userSession.proxy = proxy
            this.setState({})
            setSocket()
            localStorage.setItem('session', JSON.stringify({ ...userSession, socket: '' }))
        }).bind(this)
        userSession.removeUser = (async () => {
            localStorage.removeItem('session')
            userSession.user = undefined
            userSession.id = ''
            this.setState({})
            userSession.socket = undefined
        }).bind(this)
    }
    render() {
        return <UserContext.Provider value={this.state as any}>
            {this.props.children}
        </UserContext.Provider>
    }
}

function getSession() {
    try {
        const session = JSON.parse(localStorage.session)
        if (session.user && session.id)
            return session
    } catch (error) { }
    return {}
}

function setSocket() {
    if (userSession.id && !userSession.socket) {
        userSession.socket = io(process.env.REACT_APP_BASE_URL, { auth: { username: userSession.user.username, id: userSession.id }, autoConnect: false, })
        applySocketIO(userSession.socket)
        userSession.socket.connect()
    }
}

type _socket = Socket<any, any>