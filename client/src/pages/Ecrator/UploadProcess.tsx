import { Alert, Box, Button, Card, LinearProgress, Typography } from "@mui/material"
import { GridToolbarColumnsButton, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from "@mui/x-data-grid"
import React from "react"
import { Link } from "react-router-dom"
import { ecraterAPI } from "../../api/ecrater"
import { Utils } from "../../common/utils"
import { CDataGrid } from "../../components/CDataGrid"
import { SocketContext, socketStatus } from "../../context/SocketContext"
import { UploadProducts, UploadProductsRouter } from "./UploadProducts"

export class UploadProductsProcess extends React.Component {
    addProducts: any

    render() {
        return <SocketContext.Consumer>
            {() => {
                const { addProducts } = socketStatus.status
                const isComplete = !addProducts
                if (addProducts) this.addProducts = addProducts
                if (!this.addProducts) return UploadProductsRouter.navigate()

                return <>
                    <UploadProductsBar />
                    {isComplete && <Alert severity="success">{UploadProductsRouter.link('Quay về')}</Alert>}
                    <CDataGrid className="data-grid-no-limit"
                        sx={{ overflowX: 'unset !important' as any, height: 600 }}
                        columns={[...UploadProducts.headers, {
                            field: 'error', headerName: 'Lỗi'
                        }]}
                        rows={(this.addProducts.failedItems || []).map(({ product, error }) => { return { ...product, error } })}
                        components={{
                            Toolbar: () => <Box sx={{ width: '100%' }}>
                                <GridToolbarColumnsButton />
                                <GridToolbarFilterButton />
                                <GridToolbarDensitySelector />
                                <GridToolbarExport />
                                <Button color="error" onClick={() => {
                                    ecraterAPI.preventAddProducts()
                                }}>Hủy</Button>
                            </Box>
                        }}
                        localeText={{
                            noRowsLabel: 'Đang xử lí'
                        }}
                    >
                    </CDataGrid>
                </>
            }}
        </SocketContext.Consumer>
    }
}

export function UploadProductsBar(props) {
    if (!socketStatus.status.addProducts) return <></>
    const { done, total } = socketStatus.status.addProducts
    const percent = Math.ceil(done / total * 100).toFixed(1)

    return <SocketContext.Consumer>
        {() => <Card sx={{ p: 2 }} variant="outlined">
            <Typography>  Đang thêm: {done}/{total}</Typography>
            <div style={{ display: "flex", alignItems: 'center' }}>
                <LinearProgress sx={{ my: 2, width: '100%', mr: 1 }} variant="determinate" value={Number(percent)}></LinearProgress>
                <Typography>{percent}%</Typography>
            </div>
            {!UploadProcessRouter.isCurrentURL() && UploadProcessRouter.link('Xem ngay')}
        </Card>}
    </SocketContext.Consumer>
}

export const UploadProcessRouter = Utils.router(UploadProductsProcess, '/upload-products-process', '/ecrater')