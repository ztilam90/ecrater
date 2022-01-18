const proxy_check = require('proxy-check')
const axios = require('axios').default
const fs = require('fs')
const createHttpsProxyAgent = require('../server/node_modules/https-proxy-agent')
const { parse } = require('node-html-parser')



main()

async function main() {
    const listPromise = []
    const proxies = await getProxy()

    for (const data of proxies) {
        checkProxies(data)
    }

    await Promise.all(listPromise)
    console.log('done')

    function checkProxies({ host, port }) {
        listPromise.push(new Promise(async (resolve) => {
            try {
                await proxy_check({ host, port })
                await axios.get('https://www.ecrater.com', {
                    httpsAgent: createHttpsProxyAgent({ host, port })
                })
                console.log({ host, port, auth: '' })
                resolve()
            } catch (e) {
                resolve(e)
            }
        }))
    }
}

async function getProxy() {
    const request = await axios.get('https://free-proxy-list.net/')
    console.log('done')
    const document = parse(request.data)

    const data = []

    document.querySelectorAll('.fpl-list tbody tr').forEach((row) => {
        const result = {}
        if (row.querySelector('td:nth-child(7)').textContent !== 'yes') return
        result.host = row.querySelector('td:nth-child(1)').textContent
        result.port = row.querySelector('td:nth-child(2)').textContent
        data.push(result)
    })

    return data
}