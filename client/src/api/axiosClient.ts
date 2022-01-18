import axios from 'axios';
import queryString from 'query-string';
import { userSession } from '../context/UserContext';
const axiosClient = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    paramsSerializer: (params) => { return queryString.stringify(params) }
});

axiosClient.interceptors.request.use((config) => {
    if (userSession.user) config.headers['Authorization'] = userSession.user.username + ':' + userSession.id;
    return config;
});

axiosClient.interceptors.response.use((resp) => {
    return resp.data
}, (error) => {
    console.log()
    const result = {} as any
    if (error.data) result.error = error.data
    else result.error = error
    return result
});

export default axiosClient;