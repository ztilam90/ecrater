import React, { createElement } from "react";
import { useLocation } from 'react-router-dom';

export const SocketContext = React.createContext({} as any)

export const socketStatus: {
    status: any,
    setStatus: (status) => void
} = { status: { nodata: true } } as any

export class SocketProvider extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}

        socketStatus.setStatus = (status) => {
            socketStatus.status = status
            this.setState({})
        }
        window.addEventListener('pushstate', (...args) => console.log(['pushState', ...args]))
        window.addEventListener('popstate', (...args) => console.log(['popstate', ...args]))
        window.addEventListener('replacedstate', (...args) => console.log(['replacedstate', ...args]))
        window.addEventListener('replacestate', (...args) => console.log(['replacestate', ...args]))
    }

    render() {
        return <SocketContext.Provider value={this.state}>
            {createElement(() => {
                return <div>

                </div>
            })}
            {this.props.children}
        </SocketContext.Provider>
    }
}
