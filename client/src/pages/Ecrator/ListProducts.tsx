import { Add, Delete, Sync } from "@mui/icons-material";
import { Button, Typography } from "@mui/material";
import { GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from "@mui/x-data-grid";
import React from "react";
import CSVReader from "react-csv-reader";
import { Link, Navigate } from "react-router-dom";
import { Utils } from "../../common/utils";
import { CDataGrid } from "../../components/CDataGrid";
import { CDropdownButton } from "../../components/CDropdownButton";
import { socketStatus } from "../../context/SocketContext";
import { socketAction } from "../../socket/socket";
import { _ecraterAPI } from "./Ecrater";

export class ListProducts extends React.Component<{ ecraterAPI: _ecraterAPI }> {
    isGettingData = false

    componentDidMount(): void {
        if (!socketStatus.status.getProducts) {
            socketAction.getProducts()
        }
    }

    componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any): void {
        console.log('update', this.convertProducts())
    }

    render() {
        return <>
            {socketStatus.status.addProducts && <Navigate to={'/ecrater/upload-products'} replace={false} />}
            <div style={{ height: 600, width: '100%' }} >
                <CDataGrid
                    rows={this.convertProducts() || []}
                    columns={[
                        { field: 'id', headerName: 'ID', hide: true, },
                        { field: 'title', headerName: 'Tiêu đề', },
                        {
                            field: 'image', headerName: 'Ảnh', renderCell: ({ value }) => {
                                return <img src={value} style={{ objectFit: 'contain', width: 50, margin: 'auto' }}></img>
                            }
                        },
                        { field: 'price', headerName: 'Giá' },
                        {
                            field: 'isSync', headerName: 'Đồng bộ', renderCell: ({ value }) => <Typography {...{
                                ...value ? { color: 'green', children: 'Rồi' } : { color: 'red', children: 'Chưa' }
                            }} />
                        },
                    ]}
                    components={{
                        Toolbar: () => <GridToolbarContainer>
                            <GridToolbarColumnsButton />
                            <GridToolbarFilterButton />
                            <GridToolbarDensitySelector />
                            <GridToolbarExport />
                            <CDropdownButton
                                button={['Thêm']}
                                menu={({ menu, divider, link }) => {
                                    return [
                                        link('/ecrater/upload-products', 'Upload từ CSV', <Add />),
                                        menu('Đồng bộ', <Sync />, 'sync'),
                                        divider(),
                                        menu('Đồng bộ sâu', <Sync />, 'deepSync', { disabled: true }),
                                    ]
                                }}
                            />
                        </GridToolbarContainer>
                    }}
                    onSelectionModelChange={(model, details) => {
                        console.log(model, details)
                    }}
                    density="compact"
                />
            </div>
        </>
    }

    convertProducts() {
        const products = (socketStatus.status.getProducts || {})
        const { ecrater, server } = (products.products || { ecrater: [], server: [] })
        const productsMap = {} as any
        ecrater.forEach((p) => {
            productsMap[p.id] = p
            p.isSync = false
        })
        return Object.values(productsMap)
    }
}