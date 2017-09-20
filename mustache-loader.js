var Mustache = require('mustache')

let templateVars

module.exports = function (content) {
  this.cacheable(true)

  return Mustache.render(content, templateVars)
}

module.exports.setTemplateVars = function (tVars) {
  templateVars = tVars
}

module.exports.getTemplateVars = function () {
  return templateVars
}
