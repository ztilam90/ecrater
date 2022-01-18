import { Alert, Box, Button, Card, FormControl, LinearProgress, TextField, Typography } from "@mui/material";
import React, { useRef, useState } from "react";
import { ecraterAPI } from "../../api/ecrater";
import { CAlert } from "../../components/CAlert";
import { Utils } from "../../common/utils";
import { socketAction } from "../../socket/socket";
import { socketStatus } from "../../context/SocketContext";

export function InputProxy() {
    let input = { host: '', port: '', auth: '' }

    const proxy: any = socketStatus.status.proxy || {}

    if (proxy.status || proxy.error) {
        if (proxy.proxy) {
            input = proxy.proxy
        }
    } else {
        input = proxy
    }

    return <>
        <Card sx={{ maxWidth: 500, m: '20px auto', p: 5 }}>
            <form onSubmit={handleSubmit}>
                {proxy.error && <Alert variant="filled" severity="error" sx={{ mt: 2 }}>{proxy.error}</Alert>}
                {proxy.status && <Alert variant="filled" severity="info" sx={{ mt: 2 }}>{proxy.status}</Alert>}
                {proxy.prevent && <LinearProgress sx={{ mt: 2 }} />}
                <Box sx={{ mb: 2 }}></Box>

                <Typography variant="h4" sx={{ textAlign: 'center' }}>Cấu hình proxy</Typography>
                <FormControl><TextField label="Host" variant="standard" onChange={(evt) => input.host = evt.target.value} defaultValue={input.host} placeholder="10.10.10.10" required></TextField></FormControl>
                <FormControl><TextField label="Port" variant="standard" onChange={(evt) => input.port = evt.target.value} defaultValue={input.port} placeholder="8080" required></TextField></FormControl>
                <FormControl><TextField label="Proxy Authentication" variant="standard" onChange={(evt) => input.auth = evt.target.value} defaultValue={input.auth} placeholder="username:password"></TextField></FormControl>
                <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }} disabled={proxy.prevent}>Thiết lập</Button>
            </form>
        </Card>
    </>

    async function handleSubmit(evt) {
        evt.preventDefault()
        socketAction.setProxy(input)
    }
}