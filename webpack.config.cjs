const path = require('path');
const webpack = require('webpack');
const package = require('./package.json');

module.exports = {
    mode: 'development',
    entry: './stashku.js',
    output: {
        path: path.join(__dirname, 'web'),
        filename: `stashku-v-${package.version}.js`,
        clean: true
    },
    module: { }
};