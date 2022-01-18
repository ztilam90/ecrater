import { Upload } from "@mui/icons-material"
import { Box, Button } from "@mui/material"
import { GridToolbarContainer } from "@mui/x-data-grid"
import { useEffect, useRef, useState } from "react"
import CSVReader from "react-csv-reader"
import { Utils } from "../../common/utils"
import { CDataGrid } from "../../components/CDataGrid"
import { socketStatus } from "../../context/SocketContext"
import { socketAction } from "../../socket/socket"

export function UploadProducts() {
    let [products, setProducts] = useState([])
    let [failedItems, setFailedItems] = useState(getFailedItems())
    const [isFileSelected, setFileSelected] = useState(false)
    const [inputId] = useState(Utils.randomString(10))
    const [isUploadComplete, setUploadComplete] = useState(false)
    const headers = [
        { field: 'title', headerName: 'Tiêu đề', width: 200 },
        {
            field: 'description', headerName: 'Mô tả', renderCell: (v) => {
                return <div dangerouslySetInnerHTML={{ __html: v.value.replace(/\[/g, '<').replace(/\]/g, '>') }}></div>
            }, width: 200
        },
        { field: 'price', headerName: 'Giá' },
        { field: 'quantity', headerName: 'Số lượng' },
        { field: 'taxable', headerName: 'Thuế' }
    ]

    return <div style={{ height: 600 }} className="data-grid-no-limit">
        {(failedItems || socketStatus.status.addProducts)
            ? (() => {
                return <CDataGrid
                    sx={{ overflowX: 'unset !important' as any }}
                    columns={[...headers, {
                        field: 'error', headerName: 'Lỗi'
                    }]}
                    rows={(failedItems || []).map(({ product, error }) => { return { ...product, error } })}
                    loading={isUploadComplete}
                    components={{
                        Toolbar: () => <Box sx={{ width: '100%' }}>
                            <Button color="error">Hủy</Button>
                            <div>{socketStatus.status.addProducts && (socketStatus.status.addProducts.done + ' => ' + socketStatus.status.addProducts.total)}</div>
                        </Box>
                    }}
                >

                </CDataGrid>
            })()
            : <>
                <CSVReader inputId={inputId} inputStyle={{ width: 0, height: 0 }} onFileLoaded={(data) => {
                    setProducts(convertCSV(data))
                    setFileSelected(true)
                }} />

                <CDataGrid
                    sx={{ overflowX: 'unset !important' as any }}
                    columns={headers}
                    rows={products}
                    checkboxSelection={false}
                    components={{
                        Toolbar: () => <GridToolbarContainer>
                            <Button onClick={() => {
                                const input: HTMLInputElement = document.getElementById(inputId) as any
                                console.log(input)
                                input && input.click()
                            }}><Upload />Chọn file csv</Button>
                            {
                                isFileSelected &&
                                <Button onClick={() => {
                                    socketAction.uploadProducts(products)
                                    setFailedItems([])
                                    setUploadComplete(false)
                                }}><Upload />Upload</Button>
                            }
                        </GridToolbarContainer>
                    }}
                />
            </>
        }
    </div>

    function convertCSV(products: any[]) {
        const result = []
        const p0 = products[0]

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
                pConvert[p0[i]] = p0[i] !== 'images' ? value : value.split(',')
            }

            if (pConvert) {
                pConvert.variants = [
                    { size: 's', price: '10', quantity: 20 },
                    { size: 'm', price: '20', quantity: 20 },
                ]
                pConvert.id = i
                console.log(pConvert)
                result.push(pConvert)
            }
        }
        return result
    }

    function getFailedItems() {
        console.log('getFailedItems')
        const { status } = socketStatus.status
        if (!status) return
        const { addProducts } = status
        if (!addProducts) return
        if (addProducts) return addProducts.failedItems || failedItems || []
    }
}