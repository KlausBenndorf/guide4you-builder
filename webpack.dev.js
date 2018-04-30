'use strict'

const path = require('path')

const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const baseDir = process.cwd()

let g4uPackageInfo = require(path.join(baseDir, 'package.json'))
if (g4uPackageInfo.name !== 'guide4you') {
  g4uPackageInfo = require(path.join(baseDir, 'node_modules/guide4you/package.json'))
}

const g4uVersion = g4uPackageInfo.version

// let baseDir = process.cwd()

module.exports = {
  entry: {
    'g4u': [ 'webpack-dev-server/client?http://localhost:8080/' ]
  },
  plugins: [
    new webpack.DefinePlugin({ SWITCH_DEBUG: '\'DEBUG\'', GUIDE4YOU_VERSION: '\'v' + g4uVersion + '\'' }),
    new ExtractTextPlugin({
      filename: 'css/[name]-[hash].css'
    }),
    new webpack.SourceMapDevToolPlugin({
      filename: '[file].map'
    })
  ],
  output: {
    filename: 'js/[name]-[hash].js'
  },
  devServer: {
    quiet: false,
    noInfo: false,
    watchOptions: {
      aggregateTimeout: 300
    },
    publicPath: '/',
    inline: true,
    stats: 'normal'
  }
}
