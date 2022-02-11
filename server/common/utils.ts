import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import FormData from "form-data";
import { Collection, Db, MongoClient } from "mongodb";
import { config } from "../config";

export const utils = {
    delay(time) { return new Promise<void>((resolve) => setTimeout(() => { resolve() }, time)) },
    randomString: (length: number = 20): string => {
        let result = '';
        let characters = 'abcdefghijklmnopqrstuvwxyz';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },
    filter: {

    },
    mongoDB(callback: (db: {
        db: Db,
        userConfig: Collection<any>,
    }) => Promise<any>, dbname = config.mongo.dbName): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const connection = await MongoClient.connect(config.mongo.url)
                const db = connection.db(dbname)
                const result = await callback({
                    db: db,
                    userConfig: db.collection('user_config')
                })
                connection.close()
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    },
    getLengthFormData(form: FormData) {
        return new Promise((resolve) => form.getLength((err, length) => resolve(length)))
    },
    request(url: string, timeout = 10000) {
        return new Promise((resolve, reject) => {
            try {
                if (typeof url !== 'string') reject('wrong url: ' + url)
                const requestMethod = url.trim().startsWith('https') ? httpsRequest : httpRequest

                const request = requestMethod(url)
                request.on('error', (err) => reject(`${url} => ${err.message}`))
                request.on('response', resolve)
                request.setTimeout(timeout)
                request.end()
            } catch (error) {
                reject(`${url} => ${error.message}`)
            }
        })
    }
}