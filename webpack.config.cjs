const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');

let computeEntry = {
    'latest': './stashku.js'
};
computeEntry['v-' + pkg.version] = './stashku.js';

module.exports = {
    mode: 'development',
    entry: computeEntry,
    output: {
        path: path.join(__dirname, 'web'),
        filename: 'stashku-[name].js',
        clean: false,
        library: 'StashKu'
    },
    module: { }
};