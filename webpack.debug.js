'use strict'

const webpack = require('webpack')
const webpackMerge = require('webpack-merge')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const path = require('path')

const commonConf = require('./webpack.common.js')

let g4uPackageInfo = require('../../package.json')

if (g4uPackageInfo.name !== 'guide4you') {
  g4uPackageInfo = require('guide4you/package.json')
}

const g4uVersion = g4uPackageInfo.version

let baseDir = process.cwd()

module.exports = webpackMerge(commonConf, {
  plugins: [
    new webpack.DefinePlugin({ SWITCH_DEBUG: '\'DEBUG\'', GUIDE4YOU_VERSION: '\'v' + g4uVersion + '\'' }),
    new ExtractTextPlugin('css/g4u-debug.css')
  ],
  mustacheEvalLoader: {
    name: '[path][name].[ext]'
  },
  output: {
    filename: 'g4u-debug.js'
  }
})
