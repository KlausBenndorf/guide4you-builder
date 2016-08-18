module.exports = function (webpackConfig) {
  let proxyUrl = webpackConfig.mustacheEvalLoader.templateVars.ajaxProxy
  let validRequests = webpackConfig.mustacheEvalLoader.templateVars.proxyValidRequests
  let proxyConfig = {}
  for (let validRequest of validRequests) {
    let target = 'http://' + validRequest
    let proxy = proxyUrl.replace(/\{url\}/, encodeURIComponent(target) + '*')
    proxyConfig[proxy] = {
      target,
      secure: false,
      rewrite: function(req) {
        let proxyPrefix = proxyUrl.replace(/\{url\}/, '')
        let cleanedURI = req.url.replace(new RegExp('^' + proxyPrefix), '')
        req.url = decodeURIComponent(cleanedURI)
      }
    }
  }

  return proxyConfig
}