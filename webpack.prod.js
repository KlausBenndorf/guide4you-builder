'use strict'

const webpack = require('webpack')
const webpackMerge = require('webpack-merge')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const LicenseBannerPlugin = require('./license-banner-plugin')

let commonConf = require('./webpack.common.js')

// const baseDir = process.cwd()

const legalTemplate = '{{#license}}{{#author}}{{{author}}}, {{/author}}' +
  'License: {{license}} (https://spdx.org/licenses/{{license}}.html){{/license}}' +
  '{{^license}}(c) {{author}}{{/license}}'

const softwareInfoTemplate = `/*!
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

let g4uPackageInfo = require('../../package.json')
if (g4uPackageInfo.name !== 'guide4you') {
  g4uPackageInfo = require('guide4you/package.json')
}

const g4uVersion = g4uPackageInfo.version

module.exports = webpackMerge.smart(commonConf, {
  plugins: [
    new webpack.DefinePlugin({ SWITCH_DEBUG: '\'PRODUCTION\'', GUIDE4YOU_VERSION: '\'v' + g4uVersion + '\'' }),
    new ExtractTextPlugin({
      filename: 'css/g4u.css'
    }),
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
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    })
  ],
  output: {
    filename: 'js/g4u.js'
  },
  stats: {
    colors: true,
    chunks: false
  }
})
