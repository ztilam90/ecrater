import { Upload } from "@mui/icons-material"
import { Alert, Button } from "@mui/material"
import { GridToolbarContainer } from "@mui/x-data-grid"
import React, { createRef } from "react"
import CSVReader from "react-csv-reader"
import { ecraterAPI } from "../../api/ecrater"
import { Utils } from "../../common/utils"
import { CAlert } from "../../components/CAlert"
import { CDataGrid } from "../../components/CDataGrid"
import { SocketContext, socketStatus } from "../../context/SocketContext"
import { ConvertScript, defaultConvertMethod } from "./ConvertScript"
import { EcraterNavigate } from "./Ecrater"
import { UploadProcessRouter } from "./UploadProcess"

export class UploadProducts extends React.Component<any, UploadProductsState> {
    inputId = Utils.randomString()
    alertRef = createRef()
    alert = Utils.CAlert(this.alertRef)
    state: UploadProductsState = {
        products: [],
        isFileSelected: false,
        convertMethod: undefined,
        errorScript: false
    }

    static headers = [
        { field: 'title', headerName: 'Tiêu đề', width: 200 },
        {
            field: 'description', headerName: 'Mô tả', renderCell: (v) => {
                return <div dangerouslySetInnerHTML={{ __html: v.value && v.value.replace(/\[/g, '<').replace(/\]/g, '>') }}></div>
            }, width: 200
        },
        { field: 'price', headerName: 'Giá' },
        { field: 'quantity', headerName: 'Số lượng' },
        { field: 'tax', headerName: 'Thuế' }
    ]
    render() {
        const { state: s } = this
        const products = this.convertCSV(s.products)

        return <div style={{ height: 600 }} className="data-grid-no-limit">
            <CAlert ref={this.alertRef as any} />
            <EcraterNavigate />
            <SocketContext.Consumer>
                {() => {
                    if (socketStatus.status.addProducts) return UploadProcessRouter.navigate()
                }}
            </SocketContext.Consumer>
            <CSVReader inputId={this.inputId} inputStyle={{ width: 0, height: 0 }} onFileLoaded={(data) => {
                this.setState({ products: data, isFileSelected: true })
            }} />
            <CDataGrid
                sx={{ overflowX: 'unset !important' as any }}
                columns={UploadProducts.headers}
                rows={products}
                checkboxSelection={false}
                components={{
                    Toolbar: () => <GridToolbarContainer>
                        <Button onClick={() => {
                            console.log('click')
                            console.log(this.inputId)
                            const input: HTMLInputElement = document.getElementById(this.inputId) as any
                            input && input.click()
                        }}><Upload />Chọn file csv</Button>
                        {
                            s.isFileSelected &&
                            <Button onClick={() => {
                                ecraterAPI.addProducts(this.convertCSV(this.state.products))
                            }}><Upload />Upload</Button>
                        }
                        <ConvertScript products={s.products}
                            script={s.convertMethod ? s.convertMethod.toString() : ''}
                            onApplyScript={(script) => {
                                var convert
                                eval(script)
                                this.setState({ convertMethod: convert })
                            }}
                        />
                    </GridToolbarContainer>
                }}
            />
        </div>
    }
    convertCSV(products: any[]) {
        let result = []
        const p0 = products[0]
        const method = this.state.convertMethod || defaultConvertMethod
        for (let i = 1; i <= products.length; i++) {
            const p = products[i] || []
            let pConvert = {} as any
            if (p0.length < p.length) continue

            for (let i = 0; i < p0.length; i++) {
                const value = p[i]
                if (value === undefined) {
                    pConvert = undefined
                    continue
                }
                pConvert[p0[i]] = value
            }

            if (pConvert) {
                pConvert.id = i
                result.push(pConvert)
            }
        }
        try {
            result = method(result)
        } catch (e) {
            setTimeout(() => {
                this.alert.errorAlert('Lỗi khi thực thi script chuyển đổi: ' + (typeof e === 'string' ? e : e.message))
            })
        }
        if (!Array.isArray(result)) return []

        return result.filter((product, index) => {
            if (typeof product !== 'object' || !product) return false
            if (!product.id) product.id = index
            return true
        })
    }
}

export const UploadProductsRouter = Utils.router(UploadProducts, '/upload-products', '/ecrater')

interface UploadProductsState {
    products: any[];
    isFileSelected: boolean;
    convertMethod: (val: any) => any
    errorScript: any
}

