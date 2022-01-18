const { exec, ChildProcess, execSync } = require('child_process')
const filewatcher = require('filewatcher')
const concurrently = require('concurrently')
const { readdirSync, statSync, existsSync, mkdir, mkdirSync, rmSync, copyFileSync, readFileSync, writeFileSync } = require('fs')
const path = require('path')

main()

async function main() {
    const buildDir = path.resolve(__dirname, '../build')

    existsSync(buildDir) && rmSync(buildDir, { recursive: true })
    mkdirSync(buildDir)



    await concurrently(["cd client && npm run build", "cd server && yarn bundle"])
    rmSync(buildDir + '/server.js.LICENSE.txt')

    // await concurrently(["cd client && npm run build", "cd server && yarn build"])
    // const packageJSON = JSON.parse(readFileSync('./server/package.json', { encoding: 'utf-8' }))
    // packageJSON.scripts = {
    //     start: "node server.js"
    // }
    // packageJSON.main = 'server.js'
    // delete packageJSON.devDependencies
    // writeFileSync(buildDir + '/package.json', JSON.stringify(packageJSON, undefined, '\t'))

    writeFileSync(buildDir + '/public/index.html',
        readFileSync(buildDir + '/public/index.html', { encoding: 'utf-8' }).replace(/(href|src)="(.*?)"/g, '$1="$2?"'),
        { encoding: 'utf-8' })


    copyFileSync('./dev/.env.build', buildDir + '/.env')
    await concurrently(['cd build && npm i --production'])
}

