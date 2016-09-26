var Mustache = require('mustache')
var loaderUtils = require('loader-utils')

module.exports = function (content) {
  this.cacheable(false)
  if (!this.emitFile) throw new Error('emitFile is required from module system')

  var options = loaderUtils.getLoaderConfig(this, 'mustacheEvalLoader')

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

  this.emitFile(url, Mustache.render(content, config.templateVars))

  return 'module.exports = ' + publicPath + ';'
}
