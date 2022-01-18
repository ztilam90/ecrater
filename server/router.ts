import { _express } from "./server";
import { EcraterController } from "./api/ecrater-api"


export function applyRouter(app: _express) {
    app.use('', EcraterController)
}