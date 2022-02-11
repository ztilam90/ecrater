import axiosClient from "./axiosClient";
export const ecraterAPI = {
    login: (user) => axiosClient.post('/login', user) as any,
    getAllProducts: () => axiosClient.get('/ecrater/products') as AxiosResult,
    getProxy: () => axiosClient.get('/ecrater/proxy') as AxiosResult,
    setProxy: (proxy) => axiosClient.post('/ecrater/proxy', { proxy }) as AxiosResult,
    getScript: () => axiosClient.get('/ecrater/script') as AxiosResult,
    setScript: (script) => axiosClient.post('/ecrater/script', { script }) as AxiosResult,
    addProducts: (products) => axiosClient.post('/ecrater/products', { products }) as AxiosResult,
    preventAddProducts: () => axiosClient.post('/ecrater/products/prevent'),
    deleteProducts: (ids: any[]) => axiosClient.delete('/ecrater/products', { data: { ids } }),
    logout: () => axiosClient.post('/logout'),
}

export type AxiosResult<T = any> = Promise<{
    error: number,
    message: string,
    data: T
}>