import React from "react";

export const SocketContext = React.createContext({} as any)

export const socketStatus: {
    status: any,
    setStatus: (status) => void
} = { status: {} } as any

export class SocketProvider extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}

        socketStatus.setStatus = ((status) => {
            socketStatus.status = status
            this.setState({})
        }).bind(this)

    }

    render() {
        return <SocketContext.Provider value={this.state}>
            {this.props.children}
        </SocketContext.Provider>
    }
}
