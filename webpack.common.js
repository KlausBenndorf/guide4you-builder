'use strict'

let webpack = require('webpack')
let path = require('path')
let ExtractTextPlugin = require('extract-text-webpack-plugin')
let GatherPolyfillsPlugin = require('./gather-polyfills-plugin')
var DedupCSSPlugin = require('dedupcss-webpack-plugin')

let baseDir = process.cwd()

module.exports = {
  entry: {
    'lib/ol.js': [ path.join(baseDir, 'node_modules/guide4you-builder/openlayersChunk.js') ]
  },
  target: 'web',
  context: baseDir,
  resolveLoader: {
    alias: {
      'mustache-eval-loader': path.join(baseDir, 'node_modules/guide4you-builder/mustache-eval-loader'),
      'tojson-file-loader': path.join(baseDir, 'node_modules/guide4you-builder/tojson-file-loader')
    }
  },
  resolve: {
    root: baseDir,
    alias: {
      jquery: path.join(baseDir, '/node_modules/jquery/dist/jquery.min')
    }
  },
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        test: /\.js$/,
        exclude: /(node_modules.(?!guide4you))/,
        query: {
          presets: [ 'es2015-ie' ],
          plugins: [ 'transform-runtime' ]
        }
      },
      {
        loader: 'mustache-eval-loader',
        name: 'images/[name].[ext]',
        test: /\.svg$/
      },
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader!less-loader', {
          publicPath: '../'
        })
      }
    ],
    noParse: [
      /.*\\ol(-debug)?\.js/,
      /.*\/ol(-debug)?\.js/,
      /.*\\jquery\.min\.js/,
      /.*\/jquery\.min\.js/,
      /proj4\.js$/
    ]
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new GatherPolyfillsPlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      name: [ 'lib/g4u.js', 'lib/ol.js' ]
    }),
    new DedupCSSPlugin({
      override: true
    })
  ]
}
