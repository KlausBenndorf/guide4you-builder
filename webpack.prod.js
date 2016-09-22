'use strict'

let webpack = require('webpack')
let webpackMerge = require('webpack-merge')
let ExtractTextPlugin = require('extract-text-webpack-plugin')
let LicenseBannerPlugin = require('./license-banner-plugin')
let g4uVersion = require('guide4you/package.json').version

let commonConf = require('./webpack.common.js')

let legalTemplate = '{{#license}}{{#author}}{{{author}}}, {{/author}}' +
  'License: {{license}} (https://spdx.org/licenses/{{license}}.html){{/license}}' +
  '{{^license}}(c) {{author}}{{/license}}'

let softwareInfoTemplate = `/*!
 * {{name}}
 * Version: {{version}} (built {{date}})
 * ${legalTemplate}
 * Homepage: {{{homepage}}}
 *
 * This software contains (parts of) the following software packages:
{{#dependencies}}
 * {{name}} v{{version}}, {{{homepage}}}, ${legalTemplate}
{{/dependencies}}
 */`

module.exports = webpackMerge(commonConf, {
  resolve: {
    alias: {
      openlayers: 'openlayers/dist/ol'
    }
  },
  plugins: [
    new webpack.DefinePlugin({ SWITCH_DEBUG: '\'PRODUCTION\'', GUIDE4YOU_VERSION: 'v' + g4uVersion }),
    new ExtractTextPlugin('css/g4u.css'),
    new webpack.optimize.UglifyJsPlugin({
      mangle: {
        screw_ie8: true
      },
      sourceMap: false,
      compress: {
        screw_ie8: true,
        dead_code: true,
        warnings: false,
        unused: true
      },
      comments: false,
      beautify: false,
      exclude: /ol\.js/
    }),
    new LicenseBannerPlugin({
      bannerTemplate: softwareInfoTemplate,
      raw: true,
      additionalData: {
        date: (new Date()).toDateString()
      },
      recursiveInclude: /.*guide4you.*/
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
