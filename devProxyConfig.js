module.exports = function (webpackConfig) {
  let templateVars = require('./mustache-eval-loader').getTemplateVars()
  let proxyUrl = templateVars.ajaxProxy
  let validRequests = templateVars.proxyValidRequests
  let proxyConfig = {}
  for (let validRequest of validRequests) {
    let target = 'http://' + validRequest
    let proxy = proxyUrl.replace(/\{url}/, encodeURIComponent(target)) + '*'
    proxyConfig[proxy] = {
      target: target,
      changeOrigin: true,
      secure: false,
      pathRewrite: function (path, req) {
        return decodeURIComponent(path.replace(proxy.slice(0, -1), ''))
      }
    }
  }

  return proxyConfig
}
