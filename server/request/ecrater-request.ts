// @ts-nocheck
import axios, { AxiosResponse } from 'axios'
import FormData from 'form-data'
import createHttpsProxyAgent from 'https-proxy-agent'
import { parse } from 'node-html-parser'
import proxy_check from 'proxy-check'
import queryString from 'query-string'
import request from 'request'
import { utils } from '../common/utils'
import { config } from '../config'
import { Proxy, User } from '../declare'
const { waitRequest, completeRequest } = getWattingRequest()

const ecraterAxios = axios.create({
    baseURL: config.requests.baseURL,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36',
        'Connection': 'keep-alive',
        'Origin': 'https://www.ecrater.com'
    }
})

export const ecraterRequest = {
    async userLogin(user: User) {
        waitRequest()
        let loginRequest: AxiosResponse;

        try {
            let userData = queryString.stringify({
                user: user.username,
                pass: user.password,
                login: ''
            })

            utils.delay(config.delayRequest)

            loginRequest = await ecraterAxios.post(config.requests.login, userData, {
                headers: {
                    "Content-Type": ` application/x-www-form-urlencoded`
                },
            })

            completeRequest()
        } catch (err) {
            completeRequest()
            return { status: false, error: err.message }
        }

        const authStatus = ecraterRequest.checkResponse(loginRequest).auth()
        if (authStatus.status === false) return { ...authStatus, error: 'Đăng nhập thất bại' }

        const cookie = loginRequest.request._redirectable._options.query + ';'

        return { status: true, cookie: cookie }
    },
    async initCookies(user: User, proxy: Proxy, done: (data: { done: number, total: number }) => any) {
        let userData = queryString.stringify({
            user: user.username,
            pass: user.password,
            login: ''
        })
        const cookies = []
        const httpsAgent = createHttpsProxyAgent(proxy)

        try {
            await ecraterRequest.multipleRequest(async () => {
                console.log('staPrt request')
                let loginRequest: AxiosResponse
                try {
                    loginRequest = await ecraterAxios.post(config.requests.login, userData, {
                        headers: {
                            "Content-Type": ` application/x-www-form-urlencoded`
                        },
                        httpsAgent: httpsAgent
                    })
                } catch (error) {
                    const isDeathProxy = await ecraterRequest.testProxy(proxy)
                    if (isDeathProxy) throw 'proxy'
                }

                if (ecraterRequest.checkResponse(loginRequest).auth().status === false) {
                    throw 'login'
                }

                const cookie = loginRequest.request._redirectable._options.query + ';'
                cookies.push(cookie)
                await done({ done: cookies.length, total: config.maxCookiesUsage })
            }, async () => {
                await utils.delay(config.delayRequest)
                return [config.maxCookiesUsage - cookies.length, config.maxRequestSameTime]
            })

            return { status: true, cookies: cookies }
        } catch (error) {
            return { status: false, error: error }
        }

    },
    async addProducts(proxy: Proxy, products, cookies: string[],
        events: (status: { done: number, total: number, error: string, product: any }) => void = () => { },
        hasPrevent: () => boolean = () => true) {
        let cookiesIndex = -1
        let doneRequestCount = 0
        let indexProducts = 0
        const delayTime = config.delayRequest / Math.floor(config.maxCookiesUsage / config.maxRequestSameTime)
        const httpsAgent = createHttpsProxyAgent(proxy)
        await ecraterRequest.multipleRequest(async () => {
            const product = products[indexProducts++]
            if (!product) return
            const error = await addProduct(product)
            events({ done: ++doneRequestCount, total: products.length, error, product })
        }, async () => {
            utils.delay(delayTime)
            return [products.length - doneRequestCount, config.maxRequestSameTime]
        })

        function addProduct(p) {
            return new Promise<void>(async (resolve, reject) => {
                try {
                    if (typeof p.images === 'string') p.images = [p.images]

                    if (!Array.isArray(p.images)) { throw '[image_url] là bắt buộc' }
                    const formAddProduct = new FormData()
                    p.images.forEach(image => formAddProduct.append('ufile[]', request(image.trim())))

                    {
                        p.lcid = p.lcid || '2339981' // local category
                        p.tax = p.tax || '0'
                        p.weight = p.weight || '1'
                        p.used = p.used || '0' // Condition
                        p.shipping = p.shipping || '0'
                        p.gcid = p.gcid || '64' // Global Category
                        p.gcid_root = p.gcid_root || '64' // Global Sub Cat
                    }

                    formAddProduct.append('MAX_FILE_SIZE', '20000000')
                    formAddProduct.append('name', p.title)
                    formAddProduct.append('desc', p.description)

                    formAddProduct.append('price', p.price)
                    formAddProduct.append('lcid', p.lcid)
                    formAddProduct.append('gcid_root', p.gcid_root || '0')
                    formAddProduct.append('tax', p.tax)
                    formAddProduct.append('qty', p.quantity)
                    formAddProduct.append('weight', p.weight)
                    formAddProduct.append('used', p.used)
                    formAddProduct.append('shipping', p.shipping)
                    formAddProduct.append('gcid', p.gcid)

                    formAddProduct.append('flat_rate[1][primary]', '')
                    formAddProduct.append('flat_rate[1][secondary]', '')
                    formAddProduct.append('flat_rate[2][primary]', '')
                    formAddProduct.append('flat_rate[2][secondary]', '')
                    formAddProduct.append('flat_rate[3][primary]', '')
                    formAddProduct.append('flat_rate[3][secondary]', '')
                    formAddProduct.append('addbut_x', 'Add')

                    const length = await utils.getLengthFormData(formAddProduct)
                    if (++cookiesIndex >= cookies.length) cookiesIndex = 0
                    const cookie = cookies[cookiesIndex]

                    let resp: AxiosResponse
                    try {
                        // add products
                        resp = await ecraterAxios.post(config.requests.addProducts, formAddProduct, {
                            headers: {
                                ...formAddProduct.getHeaders(),
                                'Content-Type': `multipart/form-data`,
                                'Content-Length': length + '',
                                'Cookie': cookie
                            },
                            httpsAgent: httpsAgent
                        })

                        let checkResponse = ecraterRequest.checkResponse(resp)

                        if (!checkResponse.auth().status) {
                            return reject('login')
                        } else if (checkResponse.redirectPath === '/admin/addprod.php') {
                            let contentError = checkResponse.getError()
                            if (!contentError) {
                                contentError = 'Không xác định'
                            }
                            return resolve(contentError)
                        }

                        if (checkResponse.redirectPath === '/admin/editprod.php') {
                            const id = resp.request._redirectable._options.query.match(/pid=(.*?)&/)[1]
                            p.id = id
                        } else {
                            return resolve('Không xác định')
                        }

                        // add variants
                        if (Array.isArray(p.variants)) {
                            const formVariants = new FormData()
                            try {
                                if (p.variants.length === 0) throw 'empty'
                                p.variants.forEach((variant, index) => {
                                    const { size, price, quantity } = variant

                                    formVariants.append(`size[${index}]`, size)
                                    formVariants.append(`price[${index}]`, price)
                                    formVariants.append(`qty[${index}]`, quantity)
                                })
                            } catch (error) {
                                delete p.variants
                            }
                            console.log('p.variants', p.id, p.variants)
                            if (p.variants) {
                                formVariants.append('updatebut_x', 'Update')
                                await utils.delay(config.delayRequest)
                                resp = await ecraterAxios.post(config.requests.addVariants, formVariants, {
                                    headers: {
                                        ...formVariants.getHeaders(),
                                        'Content-Length': length + '',
                                        'Cookie': cookie
                                    },
                                    httpsAgent: httpsAgent
                                })
                                checkResponse = ecraterRequest.checkResponse(resp)
                                const error = checkResponse.getError()
                                if (error) throw error
                            }
                        }
                    } catch (error) {
                        return resolve(error)
                    }
                } catch (error) {
                    console.log(error)
                    return resolve(error)
                }

                return resolve()
            })
        }
    },
    async listProducts(proxy: Proxy, cookies: string[], interupt?: () => boolean) {
        let cookieIndex = 0
        const listProduct = []
        let page = 0
        let maxPage
        try {
            await ecraterRequest.multipleRequest(async () => {
                let request: AxiosResponse
                if (interupt && interupt()) throw 'interupt'
                try {
                    request = await ecraterAxios.get(config.requests.listProducts, {
                        headers: {
                            Cookie: cookies[cookieIndex]
                        },
                        params: { srn: page }
                    })
                } catch (error) {
                    const isDeathProxy = await ecraterRequest.testProxy(proxy)
                    if (isDeathProxy) throw 'proxy'
                    return
                }

                if (request.status !== 200) return
                if (maxPage === undefined) {
                    const size = ecraterRequest.checkResponse(request).listProductSize()
                    console.log([size, Math.floor((size - 1) / 40) + 1])
                    if (size === 0) return maxPage = 0
                    else maxPage = Math.floor((size - 1) / 40) + 1
                }

                const document = parse(request.data)
                const item = document.querySelectorAll('.prodoct-list .list-group-item')
                item.forEach((productE) => {
                    const product = {} as any
                    product.id = productE.querySelector('.btn-edit').parentNode.getAttribute('href').match(/pid=([0-9]*)/)[1]
                    product.title = productE.querySelector('.nav_sel').textContent.trim()
                    product.image = productE.querySelector('img').getAttribute('src').replace(/s.jpg/, 'b.jpg')
                    product.price = productE.querySelector('.item-price').textContent.trim().replace('$', '')
                    listProduct.push(product)
                })

                ++cookieIndex
                ++page
                if (cookieIndex >= cookies.length) cookieIndex = 0
            }, () => {
                utils.delay(config.delayRequest)
                if (maxPage === undefined) return [1]
                else {
                    return [config.maxRequestSameTime, maxPage - page]
                }
            })

            return { status: true, products: listProduct }
        } catch (error) {
            return { status: false, error: error }
        }
    },
    async deleteProducts(user: User, productsIds: string[], cookies: string[]) {

    },
    async testProxy(proxy: Proxy) {
        try {
            const { host, port } = proxy
            const proxyCheck = { host, port } as any
            if (proxy.auth) {
                proxyCheck.proxyAuth = proxy.auth
            }

            await proxy_check(proxyCheck)
            const httpsAgent = createHttpsProxyAgent(proxy)
            const request = await axios.get(config.requests.baseURL, {
                httpsAgent: httpsAgent
            })
            return true
        } catch (error) {
            return false;
        }
    },
    async multipleRequest(generateNextRequest: () => Promise<any>,
        getLimitPromise: () => Promise<number[]> | number[]
    ) {
        let error
        while (true) {
            const listPromise = []
            const limit = Math.min.apply(undefined, await getLimitPromise())
            if (isNaN(limit) || !isFinite(limit) || limit <= 0) break

            for (let i = 0; i < limit; i++) {
                const promise = generateNextRequest()
                if (!promise) {
                    getLimitPromise = () => new Promise((resolve) => resolve([0]))
                    break
                }
                listPromise.push(new Promise<void>((resolve) => {
                    promise
                        .then(() => { resolve() })
                        .catch((e) => {
                            if (!error) error = e
                            resolve()
                        })
                }))
            }

            await Promise.all(listPromise)
            if (error) throw error
        }
    },
    checkResponse(res: AxiosResponse) {
        const redirectPath = res.request._redirectable._options.pathname

        return {
            auth() {
                if (redirectPath === '/login.php') {
                    return { status: false, data: res.data }
                } else {
                    return { status: true }
                }
            },
            listProductSize() {
                const document = parse(res.data)
                if (document.querySelector('.noprod')) return 0
                else return Number(document.querySelector('.prodoct-list .list-head .outOf').textContent.match(/^.*of\s(.*)/)[1])
            },
            getError() {
                try {
                    const content_err = parse(res.data).querySelector('.content_err')
                    if (content_err) return content_err.textContent.trim()
                } catch (e) { }
            },
            redirectPath: redirectPath
        }
    },
    async testCookie(cookie: string, proxy: Proxy) {
        try {
            const request = await ecraterAxios.get('/admin/tips.php', {
                headers: {
                    Cookie: cookie
                }
            })
            if (ecraterRequest.checkResponse(request).auth().status === false) return false
            return true
        } catch (error) {
            console.log(error)
            return false
        }
    }
}

function getWattingRequest() {
    let requestProcessedCount = 0

    return {
        completeRequest,
        waitRequest
    }

    function completeRequest() {
        --requestProcessedCount
    }

    function waitRequest() {
        return new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                if (requestProcessedCount < config.maxRequestSameTime) {
                    ++requestProcessedCount
                    clearInterval(interval)
                    resolve()
                }
            }, 5)
        })
    }
}