import dotenv from "dotenv";
import path from "path/posix";

dotenv.config({ path: path.join(__dirname, './.env') });
export const config = {
    maxRequestSameTime: 3,
    maxCookiesUsage: 6,
    delayRequest: 1500,
    requests: {
        baseURL: 'https://www.ecrater.com',
        login: '/log.php',
        logout: '/admin/logout.php',
        postBook: '/admin/addprod.php?cid=0&processed=1',
        listProducts: '/admin/products.php?',
        addProducts: '/admin/addprod.php?cid=0&processed=1&',
        addVariants: (id) => `/admin/pvariants.php?pid=${id}&cid=0&srn=0&attr1=size&`,
        deleteProduct: (id) => `/admin/delp.php?pid=${id}&cid=0&srn=0`
    },
    mongo: {
        dbName: process.env.MongoDBName || 'ecrater',
        url: process.env.MongoDBConnection
    },
    port: process.env.PORT || 3000,
    isDevMode: process.env.NODE_ENV === 'development'
}
