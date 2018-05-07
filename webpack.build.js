'use strict'

const webpack = require('webpack')
const LicenseBannerPlugin = require('./license-banner-plugin')

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

module.exports = {
  mode: 'production',
  plugins: [
    new LicenseBannerPlugin({
      bannerTemplate: softwareInfoTemplate,
      raw: true,
      additionalData: {
        date: (new Date()).toDateString()
      },
      basePath: baseDir,
      recursiveInclude: /.*guide4you.*/,
      parsePeerDependencies: true
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    })
  ]
}
