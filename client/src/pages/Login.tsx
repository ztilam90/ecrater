import { Button, Card, FormControl, LinearProgress, TextField, Typography } from '@mui/material';
import React, { useRef, useState } from "react";
import { Navigate } from 'react-router-dom';
import { ecraterAPI } from '../api/ecrater';
import { CAlert } from '../components/CAlert';
import { userSession } from '../context/UserContext';
import { Utils } from '../common/utils';

export function Login(props) {
    const user = { username: 'abcdepot', password: '2Witro5TaV' }
    const alert = Utils.CAlert(useRef())
    const [isLogin, setLogin] = useState(false)

    async function submitEvent(evt) {
        alert.waiting()
        if (isLogin) return
        setLogin(true)
        evt.preventDefault()
        try {
            const data = await ecraterAPI.login(user)
            if (data.status === true) {
                userSession.setUser(data.user, data.id, data.proxy)
            } else {
                alert.errorAlert('Lỗi đăng nhập: ' + data.error)
            }
        } catch (error) {
            alert.errorAlert(error.message)
        }
        setLogin(false)
    }

    return <div>
        <Card sx={{ maxWidth: 500, m: '20px auto', p: 5 }}>
            {userSession.id && <Navigate to="/ecrater" ></Navigate>}
            <form onSubmit={submitEvent.bind(this)}>
                <Typography variant="h4" sx={{ textAlign: 'center' }}>Đăng nhập Ecrater</Typography>
                <FormControl>
                    <TextField label="Tên đăng nhập" variant="standard" defaultValue={user.username} onChange={(evt) => { user.username = evt.target.value }}></TextField>
                </FormControl>
                <FormControl>
                    <TextField label="Mật khẩu" variant="standard" defaultValue={user.password} onChange={(evt) => { user.password = evt.target.value }}></TextField>
                </FormControl>
                <Button variant="contained" type="submit" fullWidth sx={{ mt: 2 }} disabled={isLogin}>Đăng nhập</Button>
                <CAlert ref={alert.alertRef as any}></CAlert>
            </form>
        </Card>
    </div>
}

export function requireLogin() {
    return !userSession.id && <Navigate to="/login" ></Navigate>
}

