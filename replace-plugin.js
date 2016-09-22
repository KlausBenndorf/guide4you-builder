let RawSource = require('webpack-sources').RawSource

module.exports = class ReplacePlugin {
  constructor (filePattern, replacePattern, replacement) {
    this.filePattern = filePattern
    this.replacePattern = replacePattern
    this.replacement = replacement
  }

  apply (compiler) {
    compiler.plugin('compilation', compilation => {
      compilation.plugin('optimize-chunk-assets', (chunks, callback) => {
        for (let chunk of chunks) {
          for (let file of chunk.files) {
            if (file.match(this.filePattern)) {
              let newContent = compilation.assets[file].source().replace(this.replacePattern, this.replacement)
              compilation.assets[file] = new RawSource(newContent)
            }
          }
        }
        callback()
      })
    })
  }
}
