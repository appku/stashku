const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');

module.exports = {
    mode: 'development',
    entry: './stashku.js',
    output: {
        path: path.join(__dirname, 'web'),
        filename: `stashku-v-${pkg.version}.js`,
        clean: true,
        library: 'StashKu'
    },
    module: { }
};