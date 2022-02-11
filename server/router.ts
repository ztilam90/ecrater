import { EcraterController } from "./api/ecrater/ecrater-routes";
import { _express } from "./server";


export function applyRouter(app: _express) {
    app.use('/api', EcraterController)
}