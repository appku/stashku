const path = require('path');
const webpack = require('webpack');
module.exports = {
    mode: 'development',
    entry: './index.js',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'index.js'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(html|ico)$/i,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]'
                }
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process': JSON.stringify({
                env: {
                    STASHKU_MODEL_HEADER: process.env.STASHKU_MODEL_HEADER,
                    STASHKU_FETCH_ROOT: process.env.STASHKU_FETCH_ROOT,
                    STASHKU_FETCH_PATH: process.env.STASHKU_FETCH_PATH,
                    STASHKU_FETCH_TRAILING_SLASH: process.env.STASHKU_FETCH_TRAILING_SLASH,
                    STASHKU_FETCH_OMIT_RESOURCE: process.env.STASHKU_FETCH_OMIT_RESOURCE,
                    STASHKU_FETCH_MODEL_PATH_PROPERTY: process.env.STASHKU_FETCH_MODEL_PATH_PROPERTY,
                    STASHKU_FETCH_MODEL_HEADER: process.env.STASHKU_FETCH_MODEL_HEADER
                }
            })
        })
    ],
    devServer: {
        allowedHosts: 'all', 
        watchFiles: ['./*'],
        onListening: async (devServer) => {
            if (devServer) {
                let m = await import('./server.js');
                await m.default(devServer.app, {
                    host: process.env.HOST,
                    port: process.env.PORT || 8080
                });
            }
        }
    }
};