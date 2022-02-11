import { Box, Button, ButtonGroup, Card, FormControl, TextField, Typography } from "@mui/material";
import React, { createElement } from "react";
import { Navigate, useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { ecraterAPI } from "../../api/ecrater";
import { Utils } from "../../common/utils";
import { CAlert } from "../../components/CAlert";
import { SocketContext, socketStatus } from "../../context/SocketContext";

export class InputProxy extends React.Component<any, InputProxyState> {

    state: InputProxyState = {
        isSubmitValid: false,
        waitRequest: false,
        input: { host: '', port: '', auth: '' }
    }

    alert = Utils.CAlert(React.createRef())

    componentDidMount() {
        if (socketStatus.status.proxy) {
            this.alert.errorAlert(socketStatus.status.proxy.message)
        }

        ecraterAPI.getProxy().then(({ error, message, data }) => {
            if (!error) {
                this.setState({ input: data || { host: '', port: '', auth: '' } })
            }
        })
    }

    render() {
        const { isSubmitValid, waitRequest, input } = this.state

        if (!socketStatus.status.proxy && isSubmitValid) {
            return <Navigate to="/ecrater" />
        }

        return <>
            <Card sx={{ maxWidth: 500, m: '20px auto', p: 5 }}>
                <form onSubmit={this.handleSubmit.bind(this)}>
                    <CAlert ref={this.alert.alertRef} />
                    <Box sx={{ mb: 2 }}></Box>
                    <Typography variant="h4" sx={{ textAlign: 'center' }}>Cấu hình proxy</Typography>
                    <FormControl><TextField label="Host" variant="standard" onChange={(evt) => this.setState({ input: { ...input, host: evt.target.value } })} value={input.host} placeholder="10.10.10.10" required></TextField></FormControl>
                    <FormControl><TextField label="Port" variant="standard" onChange={(evt) => this.setState({ input: { ...input, port: evt.target.value } })} value={input.port} placeholder="8080" required></TextField></FormControl>
                    <FormControl><TextField label="Proxy Authentication" variant="standard" onChange={(evt) => input.auth = evt.target.value} defaultValue={input.auth} placeholder="username:password"></TextField></FormControl>
                    <ButtonGroup fullWidth variant="contained" sx={{ mt: 2 }}>
                        <Button type="submit" fullWidth disabled={waitRequest}>Thiết lập</Button>
                        <SocketContext.Consumer>
                            {() => {

                                const { status } = socketStatus
                                const { proxy } = status || {}
                                return (!proxy || proxy.error !== -1) && createElement(() => {
                                    const navigate = useNavigate()
                                    return <Button fullWidth color="error" onClick={() => {
                                        navigate('/ecrater')
                                    }}>Trờ về</Button>
                                })
                            }}
                        </SocketContext.Consumer>
                    </ButtonGroup>
                </form>
            </Card>
        </>
    }

    async handleSubmit(evt) {
        evt.preventDefault()
        this.setState({ waitRequest: true })
        this.alert.waiting()
        const request = await ecraterAPI.setProxy(this.state.input)
        if (request.error === 0) {
            this.setState({ isSubmitValid: true })
            this.alert.successAlert(request.data)
        } else {
            this.alert.errorAlert(request.data)
        }
        this.setState({ waitRequest: false })
    }
}

export const InputProxyRouter = Utils.router(InputProxy, '/proxy', '/ecrater')

type InputProxyState = {
    isSubmitValid: boolean,
    waitRequest: boolean,
    input: { host: string, port: string, auth?: string }
}