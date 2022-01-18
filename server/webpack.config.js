var path = require('path')

module.exports = {
    entry: './server.ts',
    output: {
        path: path.resolve(__dirname, '../build'),
        filename: 'server.js'
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
    },
    target: 'node',
    module: {
        rules: [
            {
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-typescript'],
                        plugins: ['@babel/plugin-transform-runtime']
                    }
                }
            }
        ]
    },

}