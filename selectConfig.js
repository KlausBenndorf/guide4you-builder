const isArray = require('lodash/isArray')
const isPlainObject = require('lodash/isPlainObject')
const mapValues = require('lodash/mapValues')

module.exports = function selectConfig (conf, id) {
  if (isPlainObject(conf)) {
    if (conf.hasOwnProperty(id)) {
      return selectConfig(conf[id], id)
    }
    return mapValues(conf, v => selectConfig(v, id))
  }
  if (isArray(conf)) {
    return conf.map(v => selectConfig(v, id))
  }
  return conf
}
