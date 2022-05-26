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
    devServer: {
        watchFiles: ['./*']
    }
};