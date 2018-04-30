'use strict'

const path = require('path')

const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const LicenseBannerPlugin = require('./license-banner-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const baseDir = process.cwd()

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
    new LicenseBannerPlugin({
      bannerTemplate: softwareInfoTemplate,
      raw: true,
      additionalData: {
        date: (new Date()).toDateString()
      },
      recursiveInclude: /.*guide4you.*/,
      parsePeerDependencies: true
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    })
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
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
        }
      })
    ]
  },
  output: {
    filename: 'js/[name].js'
  }
}
