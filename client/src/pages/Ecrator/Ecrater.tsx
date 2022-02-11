import { Add, List } from "@mui/icons-material";
import { Alert, AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import React from 'react';
import { Route, Routes } from "react-router-dom";
import { ecraterAPI } from "../../api/ecrater";
import { CDropdownButton } from "../../components/CDropdownButton";
import { SocketContext, socketStatus } from "../../context/SocketContext";
import { userSession } from "../../context/UserContext";
import { requireLogin } from "../Login";
import { InitCookiesRouter } from "./InitCookies";
import { InputProxyRouter } from "./InputProxy";
import { ListProducts } from "./ListProducts";
import { UploadProcessRouter, UploadProductsBar } from "./UploadProcess";
import { UploadProducts, UploadProductsRouter } from "./UploadProducts";

export function Ecrater() {
    async function logout() {
        ecraterAPI.logout()
        setTimeout(() => userSession.removeUser())
    }
    return <>
        {requireLogin()}
        <div>
            <AppBar position="static" color="transparent" sx={{ m: 0 }}>
                <Toolbar variant="regular">
                    <Typography variant="body1" component="div" sx={{ mr: 'auto' }}>
                        <CDropdownButton
                            button={['Ecrater']}
                            menu={({ menu, divider, link }) => {
                                return [
                                    link('/ecrater/upload-products', 'Upload từ CSV', <Add />),
                                    link('/ecrater/proxy', 'Thiết lập lại proxy', <Add />),
                                    link('/ecrater', 'Sản phẩm', <List />),
                                ]
                            }}
                        />
                    </Typography>
                    <Button variant="contained" color="error" onClick={logout}>Đăng xuất</Button>
                </Toolbar>
            </AppBar>
            <div style={{ margin: 8, padding: 10 }}>

                <Box sx={{ m: 3 }} />

                <Routes>
                    <Route path="/upload-products" element={<UploadProducts />} />
                    {InitCookiesRouter.router()}
                    {InputProxyRouter.router()}
                    {UploadProductsRouter.router()}
                    {UploadProcessRouter.router()}
                    <Route path="*" element={<ListProducts />} />
                </Routes>
                <Box />
            </div>
        </div>
    </>
}

export function EcraterNavigate() {
    return <SocketContext.Consumer>{() => {

        const { status } = socketStatus
        const { proxy, initCookies } = status

        return <>
            {(initCookies && InitCookiesRouter.navigate())
                || (proxy && proxy.error === -1 && InputProxyRouter.navigate())
                || <></>}
            {status.proxy && status.proxy !== -1 && !InputProxyRouter.isCurrentURL() && <>
                <Alert severity="warning">{status.proxy.message} {InputProxyRouter.link('Đặt lại proxy mới')}</Alert>
            </>}
            {status.addProducts &&
                <>
                    <UploadProductsBar />
                </>}
            {
                status.deleteProducts && <>
                    <Alert severity="info">Đang xóa: (Đã xong: {status.deleteProducts.done}, Tổng: {status.deleteProducts.total}, Lỗi: {status.deleteProducts.error})</Alert>
                </>
            }
        </>
    }
    }</SocketContext.Consumer>


}

export type _ecraterAPI = {
    uploadProducts?: (products) => any
}