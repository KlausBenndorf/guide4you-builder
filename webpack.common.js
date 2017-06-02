'use strict'

const webpack = require('webpack')
const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const GatherPolyfillsPlugin = require('./gather-polyfills-plugin')

const baseDir = process.cwd()

module.exports = {
  target: 'web',
  entry: {
    'g4u': [ 'babel-polyfill' ]
  },
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
    ],
    extensions: ['.js']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules.(?!guide4you))/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [ 'env' ]
          }
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
    library: 'g4u',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  externals: {
    'openlayers': {
      commonjs: 'ol',
      commonjs2: 'ol',
      amd: 'ol',
      root: 'ol'
    },
    'jquery': {
      commonjs: 'jQuery',
      commonjs2: 'jQuery',
      amd: 'jQuery',
      root: 'jQuery'
    }
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new GatherPolyfillsPlugin()
  ]
}
