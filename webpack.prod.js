'use strict'

let webpack = require('webpack')
let webpackMerge = require('webpack-merge')
let ExtractTextPlugin = require('extract-text-webpack-plugin')
let path = require('path')
let fs = require('fs')

let commonConf = require('./webpack.common.js')

let baseDir = process.cwd()

let packageObj = JSON.parse(fs.readFileSync(path.join(baseDir, 'package.json'), 'utf-8'))
let softwareInfo = '/*\n * ' + packageObj.name + '\n * Version: ' + packageObj.version + '\n * Date: ' +
  (new Date()).toDateString() + '\n * copyright (c) ' + (new Date()).getFullYear() + ' ' + packageObj.author + '\n * ' +
  packageObj.homepage + '\n */'

module.exports = webpackMerge(commonConf, {
  resolve: {
    alias: {
      openlayers: 'openlayers/dist/ol'
    }
  },
  plugins: [
    new webpack.DefinePlugin({ SWITCH_DEBUG: '\'PRODUCTION\'' }),
    new ExtractTextPlugin('css/g4u.css'),
    new webpack.optimize.UglifyJsPlugin({
      mangle: true,
      sourceMap: false,
      compress: {
        dead_code: true, // jshint ignore:line
        warnings: false
      },
      beautify: false,
      comments: false,
      'screw-ie8': true,
      exclude: /ol\.js/
    }),
    new webpack.BannerPlugin(softwareInfo, {
      raw: true,
      entryOnly: true
    })
  ],
  mustacheEvalLoader: {
    name: '[path][name].[ext]'
  },
  output: {
    filename: '[name]',
    chunkFilename: '[name]'
  },
  stats: {
    colors: true,
    chunks: false
  }
})
