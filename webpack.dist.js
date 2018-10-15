'use strict'

const path = require('path')

const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin')

const baseDir = process.cwd()

let g4uPackageInfo = require(path.join(baseDir, 'package.json'))
if (g4uPackageInfo.name !== 'guide4you') {
  g4uPackageInfo = require(path.join(baseDir, 'node_modules/guide4you/package.json'))
}

const g4uVersion = g4uPackageInfo.version

module.exports = {
  plugins: [
    new webpack.DefinePlugin({ SWITCH_DEBUG: '\'PRODUCTION\'', GUIDE4YOU_VERSION: '\'v' + g4uVersion + '\'' }),
    new ExtractTextPlugin({
      filename: 'css/[name].css'
    }),
    new HtmlWebpackIncludeAssetsPlugin({
      assets: [
        '../node_modules/jquery/dist/jquery.min.js',
        '../node_modules/ol/dist/ol.js'
      ],
      append: false
    })
  ],
  optimization: {
    minimize: true
  },
  output: {
    filename: 'js/[name].js'
  }
}
