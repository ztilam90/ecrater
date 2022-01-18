import { AppBar, Box, Button, Card, LinearProgress, Toolbar, Typography } from "@mui/material";
import { SocketContext, socketStatus } from "../../context/SocketContext";
import { requireLogin } from "../Login";
import { InputProxy } from "./InputProxy";
import { ListProducts } from "./ListProducts";
import React, { useState } from 'react'
import { UploadProducts } from "./UploadProducts";
import { Navigate, Route, Routes } from "react-router-dom";

export function Ecrater() {
    const [render, setRender] = useState(['listProducts'])
    const api: _ecraterAPI = {
        uploadProducts: (products) => {
            setRender(['uploadProducts', products])
        }
    }
    return <>
        {requireLogin()}
        <SocketContext.Consumer>
            {() => <>
                <AppBar position="static" color="transparent" sx={{ m: 0 }}>
                    <Toolbar variant="regular">
                        <Typography variant="body1" component="div" sx={{ mr: 'auto' }}>Ecrater</Typography>
                        <Button variant="contained" color="warning" >Đăng xuất</Button>
                    </Toolbar>
                </AppBar>
                <div style={{ margin: 8, padding: 10 }}>
                    {(() => {
                        if (!Object.keys(socketStatus.status).length) return

                        const i = socketStatus.status.initCookies
                        const { status } = socketStatus
                        const { proxy } = status

                        if (!i) {
                            return <>
                                <Box sx={{ m: 3 }} />
                                {
                                    (!proxy || proxy.error || proxy.status)
                                        ? <InputProxy />
                                        : <>
                                            <Routes>
                                                <Route path="/upload-products" element={<UploadProducts />} />
                                                <Route path="*" element={<ListProducts ecraterAPI={api} />} />
                                            </Routes>

                                        </>
                                }

                            </>
                        }

                        const percent = (i.done * 100 / i.total).toFixed(1)
                        return <Card sx={{ p: 2 }} variant="outlined">
                            <Typography>  Đang khởi tạo cookie: {i.done}/{i.total}</Typography>
                            <div style={{ display: "flex", alignItems: 'center' }}>
                                <LinearProgress sx={{ my: 2, width: '100%', mr: 1 }} variant="determinate" value={Number(percent)}></LinearProgress>
                                <Typography>{percent}%</Typography>
                            </div>
                        </Card>

                    })()}
                </div>
            </>}
        </SocketContext.Consumer>
    </>
}

export type _ecraterAPI = {
    uploadProducts?: (products) => any
}