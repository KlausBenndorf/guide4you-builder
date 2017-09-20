var Mustache = require('mustache')
var loaderUtils = require('loader-utils')

var mustacheLoader = require('./mustache-loader')

let templateVars = mustacheLoader.getTemplateVars()

module.exports = function (content) {
  this.cacheable(false)
  if (!this.emitFile) throw new Error('emitFile is required from module system')

  console.warn('mustache-eval-loader is considered deprecated. Use file-loader!mustache-loader instead.')

  var options = loaderUtils.getOptions(this)

  var config = {
    publicPath: false,
    name: '[hash].[ext]'
  }

  // options takes precedence over config
  Object.keys(options).forEach(function (attr) {
    config[attr] = options[attr]
  })

  var url = loaderUtils.interpolateName(this, config.name, {
    context: config.context || this.options.context,
    content: content,
    regExp: config.regExp
  })

  var publicPath = '__webpack_public_path__ + ' + JSON.stringify(url)

  if (config.publicPath) {
    // support functions as publicPath to generate them dynamically
    publicPath = JSON.stringify(
      typeof config.publicPath === 'function'
        ? config.publicPath(url)
        : config.publicPath + url
    )
  }

  this.emitFile(url, Mustache.render(content, templateVars))

  return 'module.exports = ' + publicPath + ';'
}

module.exports.setTemplateVars = function (tVars) {
  console.warn('mustache-eval-loader#setTemplateVars is considered deprecated.' +
    'Use mustache-loader#setTemplateVars instead.')

  mustacheLoader.setTemplateVars(tVars)
}

module.exports.getTemplateVars = function () {
  return mustacheLoader.getTemplateVars()
}
