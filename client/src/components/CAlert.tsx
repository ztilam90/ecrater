import { Alert, AlertProps } from "@mui/material";
import React, { Component } from "react";

export class CAlert extends Component<AlertProps, AlertState>{
    event() {
        setTimeout(() => {
            if (!this.justClick) {
                document.removeEventListener('click', this.event)
                this.setState({ children: '' })
            }
            return this.justClick = false
        })
    }

    justClick = false
    constructor(props) {
        super(props)
        this.state = {
            clickClose: false
        }

        this.event = this.event.bind(this)
    }
    update(state: AlertState) {
        if (state.clickClose) {
            document.addEventListener('click', this.event)
        } else {
            document.removeEventListener('click', this.event)
        }

        this.setState(state)
    }
    render() {
        const props = { ...this.props, ...this.state }
        delete props.clickClose
        return props.children
            ? <Alert {...{ sx: { my: 1 } }} {...props} variant="filled" onClick={() => {
                this.justClick = true
            }} />
            : <>{(props as any).render ?? ''}</>
    }
}

interface AlertState extends AlertProps {
    clickClose?: boolean,
    render?: any
}