var loaderUtils = require('loader-utils')

module.exports = function (content) {
  this.cacheable(false)
  if (!this.emitFile) throw new Error('emitFile is required from module system')

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
    context: config.context,
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

  if (config.emitFile === undefined || config.emitFile) {
    this.emitFile(url, JSON.stringify(this.exec(content, this.resourcePath)))
  }

  return 'module.exports = ' + publicPath + ';'
}
