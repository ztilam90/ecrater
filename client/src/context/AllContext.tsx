import React from "react"
import { SocketProvider } from "./SocketContext"
import { UserProvider } from "./UserContext"

export function ContextProvider(props) {
    return <UserProvider>
        <SocketProvider>
            {props.children}
        </SocketProvider>
    </UserProvider>
}