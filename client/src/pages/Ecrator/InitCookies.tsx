import { Card, LinearProgress, Typography } from "@mui/material";
import { url } from "inspector";
import { Navigate } from "react-router";
import { Utils } from "../../common/utils";
import { SocketContext, socketStatus } from "../../context/SocketContext";

export function InitCookies() {
    return <SocketContext.Consumer>
        {() => {
            const i = socketStatus.status.initCookies
            if (!i) return <Navigate to="/ecrater" />
            const percent = (i.done * 100 / i.total).toFixed(1)
            console.log([socketStatus.status.initCookies, 'socketStatus.status.initCookies'])
            return <Card sx={{ p: 2 }} variant="outlined">
                <Typography>  Đang khởi tạo cookie: {i.done}/{i.total}</Typography>
                <div style={{ display: "flex", alignItems: 'center' }}>
                    <LinearProgress sx={{ my: 2, width: '100%', mr: 1 }} variant="determinate" value={Number(percent)}></LinearProgress>
                    <Typography>{percent}%</Typography>
                </div>
            </Card>
        }}
    </SocketContext.Consumer>
}

export const InitCookiesRouter = Utils.router(InitCookies, '/init-cookies', '/ecrater')