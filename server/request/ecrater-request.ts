// @ts-nocheck
import axios, { AxiosResponse } from 'axios'
import FormData from 'form-data'
import createHttpsProxyAgent from 'https-proxy-agent'
import { parse } from 'node-html-parser'
import proxy_check from 'proxy-check'
import queryString from 'query-string'
import { utils } from '../common/utils'
import { config } from '../config'
import { Proxy, User } from '../declare'
const { waitRequest, completeRequest } = getWattingRequest()

const ecraterAxios = axios.create({
    baseURL: config.requests.baseURL,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36',
        'Connection': 'keep-alive',
        'Origin': 'https://www.ecrater.com',
        'Sec-Fetch-Site': 'same-origin',
        'Cache-Control': 'max-age=0'
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
                    "Content-Type": ` application/x-www-form-urlencoded`,
                    "Referer": "https://www.ecrater.com/login.php"
                },
            })

            completeRequest()
        } catch (err) {
            completeRequest()
            return { status: false, error: err.message }
        }

        const authStatus = ecraterRequest.checkResponse(loginRequest).auth()
        if (authStatus.status === false) {
            return { ...authStatus, error: 'Đăng nhập thất bại' }
        }

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
            console.log('request cookies')
            await ecraterRequest.multipleRequest(async () => {
                let loginRequest: AxiosResponse
                try {
                    loginRequest = await ecraterAxios.post(config.requests.login, userData, {
                        headers: {
                            "Content-Type": ` application/x-www-form-urlencoded`
                        },
                        httpsAgent: httpsAgent,
                        timeout: 10000,
                    })
                } catch (error) {
                    const isLiveProxy = await ecraterRequest.testProxy(proxy)
                    if (!isLiveProxy) throw 'proxy'
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
            console.log('done request')
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
            if (hasPrevent && hasPrevent()) throw 'interrupt'
            const error = await addProduct(product)
            await events({ done: ++doneRequestCount, total: products.length, error, product })
        }, async () => {
            utils.delay(delayTime)
            return [products.length - doneRequestCount, 2]
        })

        function addProduct(p) {
            return new Promise<void>(async (resolve, reject) => {
                if (++cookiesIndex >= cookies.length) cookiesIndex = 0
                const cookie = cookies[cookiesIndex]
                try {
                    if (typeof p.images === 'string') p.images = [p.images]

                    if (!Array.isArray(p.images)) { throw '[image_url] là bắt buộc' }
                    const formAddProduct = new FormData();
                    (await Promise.all(p.images.map(image => utils.request(image.trim())))).forEach((resp) => {
                        formAddProduct.append('ufile[]', resp)
                    })
                    {
                        p.lcid = p.lcid || '2339981' // local category
                        p.tax = p.tax || '0'
                        p.weight = p.weight || '1'
                        p.used = p.used || '0' // Condition  
                        p.shipping = p.shipping || '0'
                        p.gcid = p.gcid || '64' // Global Sub Cat
                        p.gcid_root = p.gcid_root || '64' // Global Category
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


                    let resp: AxiosResponse
                    try {
                        // add products
                        resp = await ecraterAxios.post(config.requests.addProducts, formAddProduct, {
                            headers: {
                                ...formAddProduct.getHeaders(),
                                'Content-Type': `multipart/form-data`,
                                'Content-Length': await utils.getLengthFormData(formAddProduct) + '',
                                'Cookie': cookie
                            },
                            httpsAgent: httpsAgent,
                            timeout: 40000
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
                                if (p.variants.length === 0) throw ''
                                p.variants.forEach((variant, index) => {
                                    const { size, price, quantity } = variant

                                    formVariants.append(`size[${index}]`, size)
                                    formVariants.append(`price[${index}]`, price)
                                    formVariants.append(`qty[${index}]`, quantity)
                                })
                            } catch (error) {
                                delete p.variants
                            }
                            if (p.variants) {
                                formVariants.append('updatebut_x', 'Update')
                                await utils.delay(config.delayRequest)
                                console.log('add variants', p.title)
                                resp = await ecraterAxios.post(config.requests.addVariants(p.id), formVariants, {
                                    headers: {
                                        ...formVariants.getHeaders(),
                                        'Content-Length': await utils.getLengthFormData(formVariants) + '',
                                        'Cookie': cookie,
                                        timeout: 20000
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
        let cookieIndex = -1
        const listProduct = []
        let page = 0
        let maxPage
        const httpsAgent = createHttpsProxyAgent(proxy)

        try {
            await ecraterRequest.multipleRequest(async () => {
                const pageIndex = page++
                if (++cookieIndex >= cookies.length) cookieIndex = 0
                const cookie = cookies[cookieIndex]
                let request: AxiosResponse
                if (interupt && interupt()) throw 'interupt'
                try {
                    request = await ecraterAxios.get(config.requests.listProducts, {
                        headers: {
                            Cookie: cookies[cookieIndex]
                        },
                        params: { srn: pageIndex },
                        timeout: 10000,
                        httpsAgent: httpsAgent
                    })
                } catch (error) {
                    const isLiveProxy = await ecraterRequest.testProxy(proxy)
                    if (!isLiveProxy) throw 'proxy'
                    return
                }

                const checkResponse = ecraterRequest.checkResponse(request)
                if (!checkResponse.auth().status) throw 'login'

                if (maxPage === undefined) {
                    const size = checkResponse.listProductSize()
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
    async deleteProducts(productsIds: string[], cookies: string[], proxy: Proxy, events?: (status: { done: number, total: number, error: string, id: string }, error) => void = () => { }) {
        const httpsAgent = createHttpsProxyAgent(proxy)
        try {
            let idIndex = 0
            let cookieIndex = -1
            let done = 0
            let error = 0
            await ecraterRequest.multipleRequest(async () => {
                const id = productsIds[idIndex++]
                if (++cookieIndex >= cookies.length) cookieIndex = 0
                const cookie = cookies[cookieIndex]
                let errorMessage

                try {
                    const request = await ecraterAxios.get(config.requests.deleteProduct(id),
                        {
                            headers: {
                                Cookie: cookie
                            },
                            httpsAgent
                        })
                    ++done
                } catch (err) {
                    errorMessage = err
                    ++error
                }
                events({ done, total: productsIds.length, error, id }, errorMessage)

            }, () => {
                return [productsIds.length - idIndex, config.maxRequestSameTime]
            })
        } catch (error) {

        }
    },
    async testProxy(proxy: Proxy) {
        try {
            console.log('check proxy')
            const { host, port } = proxy
            const proxyCheck = { host, port } as any
            if (proxy.auth) {
                proxyCheck.proxyAuth = proxy.auth
            }

            await proxy_check(proxyCheck)
            const httpsAgent = createHttpsProxyAgent(proxy)
            const request = await axios.get(config.requests.baseURL, {
                httpsAgent: httpsAgent,
                timeout: 10000
            })
            return true
        } catch (error) {
            console.log('check proxy failed')
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
                            console.log('has error ', error)
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