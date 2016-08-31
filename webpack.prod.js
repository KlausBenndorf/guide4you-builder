'use strict'

let webpack = require('webpack')
let webpackMerge = require('webpack-merge')
let ExtractTextPlugin = require('extract-text-webpack-plugin')
let ReplacePlugin = require('./replace-plugin')
let path = require('path')
let fs = require('fs')

let commonConf = require('./webpack.common.js')

let baseDir = process.cwd()

let packageObj = JSON.parse(fs.readFileSync(path.join(baseDir, 'package.json'), 'utf-8'))
let softwareInfo = `/*!
 * ${packageObj.name}
 * Version: ${packageObj.version} (built ${(new Date()).toDateString()})
 * License: ${packageObj.license} (https://spdx.org/licenses/${packageObj.license}.html)
 * Homepage: ${packageObj.homepage}
 */`

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
      mangle: {
        screw_ie8: true
      },
      sourceMap: false,
      compress: {
        screw_ie8: true,
        dead_code: true, // jshint ignore:line
        warnings: false,
        unused: true
      },
      beautify: false,
      exclude: /ol\.js/
    }),
    new ReplacePlugin(/.js$/, /\/\*+!/g, '\n\n$&'),
    new webpack.BannerPlugin(softwareInfo, {
      raw: true,
      entryOnly: true,
      exclude: /ol\.js/
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
