import Editor from "@monaco-editor/react";
import { Button, Dialog, Grid } from "@mui/material";
import React from "react";
import ReactJson from "react-json-view";
import { ecraterAPI } from "../../api/ecrater";
import { constants } from "../../common/constants";


export const defaultConvertMethod = function (products) {
    return products.map((product) => {
        // code here
        return {
            ...product,
            ...{
                images: product.images.split(',')
            }
        }
    })
}

export const defaultConvertScript = "convert = function (products) {\n  return products.map(product => {\n    product.images = product.images.split(',')\n    return product\n  });\n}"

export class ConvertScript extends React.Component<ConvertScriptProps> {
    script = { script: this.props.script ? 'convert = ' + this.props.script : '', isExecute: false }
    state = {
        isShowConvertScript: false,
        values: {} as any,
        result: undefined as any
    }
    editor: any
    convert: any
    _console: any

    setShowEditScript(isShowConvertScript = true) {
        this.setState({ isShowConvertScript })
    }
    async componentDidMount() {
        if (!this.script.script) {
            const { data: { script }, error } = await ecraterAPI.getScript()
            if (!script) return

            if (error) {
                this.script.script = defaultConvertScript
            } else {
                var convert: any
                try {
                    eval(script)
                    if (convert) {
                        this.script.script = script
                    }
                } catch (error) {
                    this.script.script = defaultConvertScript
                }

            }
            const { onApplyScript } = this.props
            onApplyScript && onApplyScript(this.script.script)
        }
    }
    render() {
        const { state } = this
        const isShowDialog = Boolean(state.isShowConvertScript)
        const content = this.script.script || defaultConvertScript

        const sourceLibs = [
            ['index.d.ts', this.generateTypescript()]
        ]
        return <>
            <Button onClick={() => {
                this.setShowEditScript()
                this.executeScript(this.script.script)
            }}>Chuyển đổi Script</Button>

            <Dialog fullScreen open={isShowDialog}>

                <Grid container spacing={2} sx={{ height: '100%' }}>
                    <Grid item sm={12} lg={7}>
                        <Button onClick={() => this.setShowEditScript(false)}>Đóng</Button>
                        <Button onClick={() => {
                            if (this.convert) {
                                const { onApplyScript } = this.props
                                onApplyScript && onApplyScript(this.script.script)
                                ecraterAPI.setScript(this.script.script)
                            }
                        }}>Lưu lại</Button>
                        <Editor language="javascript" path="/index.js" height="calc(100% - 50px)" width="100%"
                            defaultValue={content}
                            onChange={(value) => {
                                this.script = { script: value, isExecute: false }
                                setTimeout(() => {
                                    if (!this.script.isExecute) {
                                        this.executeScript(this.script.script)
                                        this.script.isExecute = true
                                    }
                                }, 500)
                            }}
                            onMount={(editor, monaco) => {
                                this.executeScript(content)
                                if (constants.isDevMode) {
                                    (window as any).editor = editor;
                                    (window as any).monaco = monaco;

                                    // validation settings
                                    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                                        noSemanticValidation: true,
                                        noSyntaxValidation: false
                                    });

                                    // compiler options
                                    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                                        target: monaco.languages.typescript.ScriptTarget.ES6,
                                        allowNonTsExtensions: true
                                    });


                                }
                                this.editor = editor
                                sourceLibs.forEach(([path, script]) => {
                                    monaco.languages.typescript.javascriptDefaults.addExtraLib(script, path)
                                })
                            }}
                        >
                        </Editor>
                    </Grid>

                    <Grid item sm={12} lg={5} overflow="auto" maxHeight="100%">
                        <ReactJson src={state.result || ['Không có giá trị nào trả về']} collapsed={1} displayDataTypes={false} name={false}></ReactJson>
                        <ReactJson src={state.values} collapsed={1} displayDataTypes={false} name={false} ></ReactJson>
                    </Grid>
                </Grid>
            </Dialog>
        </>
    }
    executeScript(script: string) {
        let values = {} as any
        let result
        let index = 0
        try {
            this._console = {
                log: (...args) => {
                    values[++index] = args.length <= 1 ? args[0] : args
                }
            }

            eval(`var console = this._console; var convert;\n${script};\nthis.convert=convert`)
        } catch (error) {
            values[++index] = ['Lỗi cú pháp: ' + error.message]
        }
        if (typeof this.convert === 'function') {

            try {
                result = this.convert(this.getProducts())
            } catch (err) {
                values[++index] = err.message
            }
        } else {
            values[0] = 'Hàm convert không được khai báo'
        }
        this.setState({ values, result })
    }
    generateTypescript() {
        const p0 = this.props.products[0]
        const listKey = p0 || []
        const keyType = listKey.map((key) => `${key}: string`).join(';\n')
        return [
            `declare type _product={\n${keyType};\n [n: string]: any\n}`,
            `declare var convert: (products: _product[])=>_productResult`,
            `declare type _productResult = {`,
            `\ttitle?: any;`,
            `\tdescription?: any;`,
            `\tprice?: any;`,
            `\t/** Local Category */`,
            `\tlcid?: any;`,
            `\t/** Global Category */`,
            `\tgcid_root?: any;`,
            `\ttax?: any;`,
            `\tquantity?: any;`,
            `\tweight?: any;`,
            `\t/** Condition */`,
            `\tused?: any;  `,
            `\tshipping?: any;`,
            `\t/** Global Sub Cat */`,
            `\tgcid?: any;`,
            `\timages: string | string[]`,
            `\tvariants?: {size: any, quantity: any, price: any}[];`,
            `}[]`
        ].join('\n')
    }
    getProducts() {
        let products = this.props.products || []
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
                pConvert[p0[i]] = value
            }

            if (pConvert) {
                pConvert.id = i
                result.push(pConvert)
            }
        }
        return result
    }
}

interface ConvertScriptProps {
    products: any,
    onApplyScript?: (script) => any,
    script?: string
}