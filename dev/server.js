const { exec, ChildProcess, execSync } = require('child_process')
const filewatcher = require('filewatcher')
const concurrently = require('concurrently')
const { readdirSync, statSync } = require('fs')
const path = require('path')

main()

async function main() {
    /**@type ChildProcess */
    let child

    const watcher = new filewatcher()
    // exec(`start cmd /k "cd ${__dirname} && cd ../client && npm run start"`)

    const pathServer = path.resolve('./server')
    const excludePath = path.join(pathServer, 'node_modules')

    addWatcher(pathServer, watcher)
    watcher.on('change', (file, stat) => {
        console.log('reload', file)
        try {
            execSync(`taskkill /f /t /pid ${child.pid}`)
        } catch (error) {

        }
        watcher.removeAll()
        addWatcher(pathServer, watcher)
        startApp()
    })

    startApp()

    function startApp() {
        child = exec(`cd ${__dirname} && cd ../server && npm run start`, { env: { FORCE_COLOR: true }, detached: true })
        child.stdout.on('data', (data) => {
            console.log(data.toString().trim())
        })
        child.stderr.on('data', (data) => {
            console.log(data.toString().trim())
        })
    }

    function addWatcher(_path, watcher) {
        if (_path === excludePath) return
        if (statSync(_path).isDirectory()) {
            const dirs = readdirSync(_path)
            for (let dir of dirs) {
                dir = path.join(_path, dir)
                addWatcher(dir, watcher)
            }
            watcher.add(_path)
        }
    }
    setInterval(() => { }, 9999999)
}

