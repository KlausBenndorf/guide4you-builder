'use strict'

const _ = require('lodash')

module.exports = class GatherPolyfillsPlugin {
  constructor (debug) {
    if (debug) {
      this.address = 'https://cdn.polyfill.io/v2/polyfill.js?features='
    } else {
      this.address = 'https://cdn.polyfill.io/v2/polyfill.min.js?features='
    }
  }

  apply (compiler) {
    let polyfillValues = []

    compiler.plugin('normal-module-factory', normalModuleFactory => {
      normalModuleFactory.plugin('before-resolve', (result, callback) => {
        for (let key of [ 'request', 'userRequest', 'resource' ]) {
          if (result[ key ] && result[ key ].match(/polyfill!/)) {
            polyfillValues = _.union(polyfillValues, result[ key ].split('!')[ 1 ].split(','))
            result[ 'request' ] = 'ignore-loader!'
            result[ key ] = 'ignore-loader!'
          }
        }

        return callback(null, result)
      })
    })

    compiler.plugin('compilation', compilation => {
      compilation.plugin('html-webpack-plugin-before-html-generation', (htmlPluginData, callback) => {
        let polyAddress = this.address + polyfillValues.join(',') + '&flags=gated'
        htmlPluginData.assets.js.unshift(polyAddress)
        callback(null, htmlPluginData)
      })
    })
  }
}
