import { DataGrid } from "@mui/x-data-grid"
import { Button, Menu, MenuItem } from "@mui/material"
import { Link } from "react-router-dom"

export type User = { username: string, password: string }
const dataGrid = React.createElement(DataGrid)
const button = React.createElement(Button)
const menuItems = React.createElement(MenuItem)
const link = React.createElement(Link)

declare type _DataGridProps = typeof dataGrid.props
declare type _ButtonProps = typeof button.props
declare type _MenuItem = typeof menuItems.props
declare type _LinkProps = typeof link.props

declare const __test: number

declare function require(moduleName: string): any;