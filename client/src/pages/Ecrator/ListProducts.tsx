import { Add, Delete, Sync } from "@mui/icons-material";
import { Alert, Button, Typography } from "@mui/material";
import { GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from "@mui/x-data-grid";
import React from "react";
import { ecraterAPI } from "../../api/ecrater";
import { CDataGrid } from "../../components/CDataGrid";
import { CDropdownButton } from "../../components/CDropdownButton";
import { socketStatus } from "../../context/SocketContext";
import { EcraterNavigate } from "./Ecrater";

export class ListProducts extends React.Component<any, ListProductsState> {
    state: ListProductsState = {
        products: undefined,
        message: '',
        isLoading: false,
        error: false
    }
    idsSelected = []
    waitDeleteComplete

    async componentDidMount() {
        if (socketStatus.status.initCookies) return
        if (socketStatus.status.deleteProducts) {
            this.waitReload()
        } else {
            this.reload()
        }
    }

    async reload() {
        if (!this.state.isLoading) {
            this.setState({ isLoading: true, products: [] })
            const { error, message, data: products } = await ecraterAPI.getAllProducts()
            if (!error) {
                this.setState({ products, error: false, isLoading: false })
            } else {
                this.setState({ error, message: `${message}`, isLoading: false })
            }
        }
    }
    waitReload() {
        if (this.waitDeleteComplete) return

        this.waitDeleteComplete = setInterval(() => {
            if (socketStatus.status.deleteProducts) return
            clearTimeout(this.waitDeleteComplete)
            this.waitDeleteComplete = undefined
            this.reload()
        }, 100)
    }

    componentWillUnmount() {
        clearTimeout(this.waitDeleteComplete)
    }
    render() {
        const { isLoading, products, error, message } = this.state
        return <>
            <EcraterNavigate />
            <div style={{ height: 600, width: '100%' }} >
                {error && <Alert severity="error">{message}</Alert>}
                <CDataGrid
                    rows={products || []}
                    columns={[
                        { field: 'id', headerName: 'ID', hide: true },
                        { field: 'title', headerName: 'Ti??u ?????', width: 300 },
                        { field: 'price', headerName: 'Gi??' },
                        {
                            field: 'sync', headerName: '?????ng b???', renderCell: ({ value }) => <Typography {...{
                                ...(value === true) ? { color: 'green', children: 'R???i' } : { color: 'red', children: 'Ch??a' }
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
                                button={['Kh??c']}
                                menu={({ menu, divider, link }) => {
                                    return [
                                        link('/ecrater/upload-products', 'Upload t??? CSV', <Add />),
                                        menu('?????ng b???', <Sync />, 'sync'),
                                        menu('X??a', <Delete />, 'delete'),
                                        divider(),
                                        menu('?????ng b??? s??u', <Sync />, 'deepSync', { disabled: true }),
                                    ]
                                }}
                                onSelect={({ value }) => {
                                    if (value === 'delete') {
                                        this.idsSelected.length && ecraterAPI.deleteProducts(this.idsSelected).then(() => {
                                            this.waitReload()
                                        })
                                    }
                                }}
                            />
                            <Button sx={{ mr: 2, ml: 'auto' }} size="small" color="success" variant="contained" onClick={this.reload.bind(this)}>
                                T???i l???i
                            </Button>
                        </GridToolbarContainer>
                    }}
                    onSelectionModelChange={(model, details) => {
                        this.idsSelected = model
                    }}
                    density="compact"
                    loading={isLoading}
                />
            </div>
        </>
    }
}

type ListProductsState = {
    products: any;
    message: string;
    isLoading: boolean;
    error: any;
}