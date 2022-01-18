import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Button, Divider, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import { Link } from 'react-router-dom';
import { Utils } from "../common/utils";
import { _ButtonProps, _MenuItem } from "../declare";

export function CDropdownButton(props: {
    button: [any, _ButtonProps?],
    menu: (r: {
        menu: (children, icon?, value?, props?: _MenuItem) => any,
        link: (to, children, icon?, props?: _MenuItem) => any,
        divider: () => any
    }) => any[],
    onSelect?: (v: { index: number, value: any }) => any
}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [id] = useState(Utils.randomString())

    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    let key = 0

    const buttonProps = props.button || []
    return <div>
        <Button
            id={`${id}-button`}
            endIcon={open ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
            aria-controls={open ? 'demo-customized-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            {...(buttonProps[1] || {})}
            disableElevation
            onClick={handleClick}
            size="small"
        >
            {buttonProps[0] || 'Options'}
        </Button>

        <Menu
            id={`${id}-menu`}
            MenuListProps={{
                'aria-labelledby': `${id}-button`,
            }}
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
        >
            {props.menu({
                menu(children = '', icon = '', value = '', p = {} as any) {
                    const index = ++key
                    return <MenuItem {...p} disableRipple key={index} onClick={(evt) => {
                        handleClose()
                        props.onSelect && props.onSelect({ index: index, value })
                    }} >
                        {icon}
                        {children}
                    </MenuItem>
                },
                link(url = '', children = '', icon = '', p = {} as any) {
                    return <Link to={url} key={Utils.randomString(10)}>
                        <MenuItem {...p} disableRipple onClick={(evt) => {
                            handleClose()
                        }} >
                            {icon}
                            {children}
                        </MenuItem>
                    </Link>
                },
                divider() {
                    return <Divider key={Utils.randomString(10)} sx={{ my: 0.5 }} />
                }
            })}
        </Menu>
    </div>
}