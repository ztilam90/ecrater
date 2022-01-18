import { AlertColor, LinearProgress } from "@mui/material"
import React, { RefObject, useEffect, useRef, useState } from "react"
import { CAlert } from '../components/CAlert'

export const Utils = {
    CAlert(ref: any) {
        return new CAlertUtils(ref)
    },
    CreateSafeState: () => {
        const mounted = useRef(false);
        useEffect(() => {
            mounted.current = true;
            return () => { mounted.current = false };
        }, []);

        return {
            SafeState: (setState) => {
                return (data) => {
                    if (mounted.current) setState(data)
                }
            }
        }
    },
    randomString: (length: number = 20): string => {
        let result = '';
        let characters = 'abcdefghijklmnopqrstuvwxyz';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}

class CAlertUtils {
    alertRef: RefObject<CAlert>

    private die() {
        if (!this.alertRef.current) return true
    }
    constructor(alertRef) {
        this.alertRef = alertRef
    }
    alert(message, type: AlertColor, clickClose: boolean = true) {
        this.alertRef.current.update({
            children: message,
            severity: type,
            clickClose: true,
            render: ''
        })
    }
    successAlert(message) {
        if (this.die()) return
        this.alert(message, 'success')
    }
    errorAlert(message) {
        if (this.die()) return
        this.alert(message, 'error')
    }
    waiting(status = true) {
        if (this.die()) return
        if (status) {
            return this.alertRef.current.update({ render: <LinearProgress sx={{ my: 2 }} />, children: '' })
        }
        this.alertRef.current.update({ render: undefined })
    }
    loaddingPrecent(percent: number) {
        if (this.die()) return
        return this.alertRef.current.update({ render: <LinearProgress sx={{ my: 2 }} value={percent} />, children: '' })
    }
    hide() {
        console.log(this)
    }
}