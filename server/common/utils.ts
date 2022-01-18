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
    }
}