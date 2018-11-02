'use strict'

const path = require('path')

const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

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
    new CopyWebpackPlugin([
      { from: 'node_modules/jquery/dist/jquery.min.js', to: 'js/jquery.min.js' }
    ]),
    new HtmlWebpackIncludeAssetsPlugin({
      assets: [
        'js/jquery.min.js'
      ],
      append: false
    })
  ],
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/](?!guide4you)/,
          priority: -10,
          minSize: 0
        },
        ol: {
          test: /[\\/]node_modules[\\/]ol[\\/]/,
          minSize: 0
        }
      }
    }
  },
  output: {
    filename: 'js/[name].js'
  }
}
