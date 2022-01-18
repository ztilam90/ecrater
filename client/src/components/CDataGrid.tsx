// @ts-nocheck
import { Button } from "@mui/material";
import { DataGrid as DG, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from "@mui/x-data-grid";
import React from "react";
import { constants } from "../common/constants";
import { Utils } from "../common/utils";
import { _DataGridProps } from '../declare'
export class CDataGrid extends React.Component<_DataGridProps> {
    id = Utils.randomString(20)
    colResize: {
        element: HTMLDivElement,
        screenX: number,
        width: number
    }
    styles = {}
    evt = {
        mouseMove: (e: MouseEvent) => {
            if (!this.colResize) return
            const col = this.colResize.element.col
            this.styles[col] = Math.max(50, e.screenX - this.colResize.screenX + this.colResize.widthResize)
            this.refs.updateStyle.innerHTML = `#${this.id} div.${col}{width: ${this.styles[col]}px !important}`
            console.log(this.refs.updateStyle.innerHTML)
        },
        mouseUp: () => {
            if (!this.colResize) return
            this.updateStyle()
            this.colResize = undefined
        },
        columnSeparatorMouseDown: (evt) => {
            if (this.colResize) return
            this.colResize = {}
            this.colResize.element = evt.currentTarget
            this.colResize.screenX = evt.screenX
            this.colResize.widthResize = this.colResize.element.parentElement.clientWidth
            this.styles[this.colResize.element.col] = this.colResize.widthResize
            this.refs.updateStyle.innerHTML = ''
            this.updateStyle()
        }
    }
    componentDidMount(): void {
        document.addEventListener('mousemove', this.evt.mouseMove)
        document.addEventListener('mouseup', this.evt.mouseUp)
        setTimeout(this.setResizeEvent.bind(this))
    }
    componentWillUnmount(): void {
        document.removeEventListener('mousemove', this.evt.mouseMove)
        document.removeEventListener('mouseup', this.evt.mouseUp)
    }
    componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any): void {
        this.setResizeEvent()
    }

    updateStyle(key) {
        let style = ''
        for (const key in this.styles) {
            style = style.concat(`#${this.id} .${key}{
                    min-width: unset !important;
                    max-width: unset !important;
                    width: ${this.styles[key]}px !important;
                }\n`)
        }
        this.refs.lastStyle.innerHTML = style
    }
    setResizeEvent() {
        const pDiv = document.getElementById(this.id)
        const separator = pDiv.querySelectorAll('.MuiDataGrid-columnSeparator')

        separator.forEach((e: HTMLDivElement) => {
            if (e.col) {
                e.removeEventListener('mousedown', this.evt.columnSeparatorMouseDown)
                delete e.col
            }
            e.parentElement.classList.forEach((cl) => { if (cl.startsWith('cix')) e.col = cl })
            if (!e.col) return
            e.addEventListener('mousedown', this.evt.columnSeparatorMouseDown)
        })
    }

    render() {
        return <>
            <div id={this.id} style={{ height: '100%', width: '100%' }}>
                <style ref="lastStyle"></style>
                <style ref="updateStyle"></style>
                <DG
                    density="compact"
                    localeText={constants.locateTextGridData}
                    checkboxSelection={true}

                    {...this.props}

                    onColumnVisibilityChange={() => {
                        setTimeout(this.setResizeEvent.bind(this))
                    }}
                    columns={this.props.columns.map((data: any, index) => ({ ...data, cellClassName: 'cix' + index, headerClassName: 'cix' + index }))}
                />
            </div>
        </>
    }
}