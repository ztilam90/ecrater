import bodyParser from "body-parser";
import express from "express";
import { existsSync, rmSync } from "fs";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { config } from "./config";
import { applyRouter } from "./router";
import { applySocketIO } from "./socket/socket";

console.log('start app')

export const _mainScriptDir = __dirname

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
    cors: { origin: '*' }
})

config.isDevMode && app.use(require('cors')({ origin: '*' }))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

applyRouter(app)
applySocketIO(io)

app.use('/', express.static(path.resolve(__dirname, './public')))
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, './public/index.html'))
})

existsSync('./cache') && rmSync('./cache', { recursive: true })

server.listen(config.port, async () => {
    console.log('listening on ' + config.port)
});

export type _express = typeof app
export type _socketIO = typeof io

