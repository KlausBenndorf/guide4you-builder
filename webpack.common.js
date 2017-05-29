'use strict'

const webpack = require('webpack')
const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const GatherPolyfillsPlugin = require('./gather-polyfills-plugin')

const baseDir = process.cwd()

module.exports = {
  target: 'web',
  context: baseDir,
  resolveLoader: {
    alias: {
      'mustache-eval-loader': path.join(baseDir, 'node_modules/guide4you-builder/mustache-eval-loader'),
      'tojson-file-loader': path.join(baseDir, 'node_modules/guide4you-builder/tojson-file-loader')
    }
  },
  resolve: {
    modules: [
      baseDir,
      'node_modules'
    ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /(node_modules.(?!guide4you))/,
        query: {
          presets: [ 'es2015-ie' ],
          plugins: [ 'transform-runtime' ]
        }
      },
      {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            'css-loader',
            'less-loader'
          ],
          publicPath: '../'
        })
      }
    ],
    noParse: [
      /proj4\.js$/
    ]
  },
  output: {
    filename: 'g4u.js',
    library: 'g4u',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  externals: {
    "openlayers": "ol",
    "jquery": "jQuery"
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    //new DedupeByRefPlugin(),
    new GatherPolyfillsPlugin(),
    // new DedupCSSPlugin({
    //   override: true
    // })
  ]
}
