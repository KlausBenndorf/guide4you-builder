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

    compiler.hooks.normalModuleFactory.tap('GatherPolyfillsPlugin', normalModuleFactory => {
      normalModuleFactory.hooks.beforeResolve.tapAsync('GatherPolyfillsPlugin', (data, callback) => {
        for (let key of [ 'request', 'userRequest', 'resource' ]) {
          if (data[ key ] && data[ key ].match(/polyfill!/)) {
            polyfillValues = _.union(polyfillValues, data[ key ].split('!')[ 1 ].split(','))
            data[ 'request' ] = 'ignore-loader!'
            data[ key ] = 'ignore-loader!'
          }
        }

        return callback(null, data)
      })
    })

    compiler.hooks.compilation.tap('GatherPolyfillsPlugin', compilation => {
      compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync('GatherPolyfillsPlugin', (data, callback) => {
        let polyAddress = this.address + polyfillValues.join(',') + '&flags=gated'
        data.assets.js.unshift(polyAddress)
        callback(null, data)
      })
    })
  }
}
