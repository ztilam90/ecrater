import axiosClient from "./axiosClient";
export const ecraterAPI = {
    login: (user) => axiosClient.post('/login', user) as any,
}