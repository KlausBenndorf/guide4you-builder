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

// let baseDir = process.cwd()

module.exports = {
  mode: 'development',
  plugins: [
    new webpack.DefinePlugin({ SWITCH_DEBUG: '\'DEBUG\'', GUIDE4YOU_VERSION: '\'v' + g4uVersion + '\'' }),
    new ExtractTextPlugin({
      filename: 'css/[name]-[hash].css'
    }),
    new webpack.SourceMapDevToolPlugin({
      filename: '[file].map'
    }),
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new CopyWebpackPlugin([
      { from: 'node_modules/jquery/dist/jquery.js', to: 'js/jquery.js' },
      { from: 'node_modules/openlayers/dist/ol-debug.js', to: 'js/ol-debug.js' }
    ]),
    new HtmlWebpackIncludeAssetsPlugin({
      assets: [
        'js/jquery.js',
        'js/ol-debug.js'
      ],
      append: false
    })
  ],
  devtool: 'eval-source-map',
  output: {
    filename: 'js/[name]-[hash].js'
  },
  devServer: {
    inline: true,
    publicPath: '/'
  }
}
