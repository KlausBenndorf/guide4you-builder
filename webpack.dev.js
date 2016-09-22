'use strict'

let webpack = require('webpack')
let webpackMerge = require('webpack-merge')
let ExtractTextPlugin = require('extract-text-webpack-plugin')
// let path = require('path')

let commonConf = require('./webpack.common.js')

let g4uVersion = require('guide4you/package.json').version

// let baseDir = process.cwd()

module.exports = webpackMerge(commonConf, {
  entry: {
    'lib/g4u.js': [ 'webpack-dev-server/client?http://localhost:8080/' ],
    'lib/ol.js': [ 'webpack-dev-server/client?http://localhost:8080/' ]
  },
  resolve: {
    alias: {
      openlayers: 'openlayers/dist/ol-debug'
    }
  },
  plugins: [
    new webpack.DefinePlugin({ SWITCH_DEBUG: '\'DEBUG\'', GUIDE4YOU_VERSION: 'v' + g4uVersion }),
    new ExtractTextPlugin('css/g4u.[hash].css'),
    new webpack.SourceMapDevToolPlugin({
      filename: '[file].map'
    })
  ],
  mustacheEvalLoader: {
    name: '[path][name].[hash].[ext]'
  },
  output: {
    filename: '[name].[hash].js',
    chunkFilename: '[name].[hash].js'
  },
  devServer: {
    quiet: false,
    noInfo: false,
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    },
    publicPath: '/',
    inline: true,
    // headers: { 'X-Custom-Header': 'yes' },
    stats: {
      colors: true,
      chunks: false
    }
  }
})
