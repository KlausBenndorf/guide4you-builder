const ConcatSource = require('webpack-sources').ConcatSource
const ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers')
const Mustache = require('mustache')
const path = require('path')

function wrapComment (str) {
  if (str.indexOf('\n') < 0) {
    return '/*! ' + str + ' */'
  }
  return '/*!\n * ' + str.split('\n').join('\n * ') + '\n */'
}

module.exports = class LicenseBannerPlugin {
  constructor (options) {
    if (arguments.length > 1) {
      throw new Error('LicenseBannerPlugin only takes one argument (pass an options object)')
    }
    if (typeof options === 'string') {
      options = {
        bannerTemplate: options
      }
    }
    this.options = options || {}
    this.bannerTemplate = this.options.raw ? options.bannerTemplate : wrapComment(options.bannerTemplate)
    this.recursiveInclude = options.recursiveInclude
    this.basePath = options.basePath || '../../'
  }

  adjustPackageInfo (packageInfo) {
    packageInfo.license = packageInfo.license || false
    packageInfo.author = packageInfo.author || false
    if (packageInfo.author && !(typeof packageInfo.author === 'string')) {
      packageInfo.author = packageInfo.author.name +
        (packageInfo.author.email ? (' <' + packageInfo.author.email + '>') : '') +
        (packageInfo.author.url ? (' (' + packageInfo.author.url + ')') : '')
    }
    return packageInfo
  }

  parsePackageInfo (packageInfo, dependencies = []) {
    if (packageInfo.dependencies !== undefined) {
      for (let dependency of Object.keys(packageInfo.dependencies)) {
        if (!dependencies.some(d => d.name === dependency)) {
          let childPackageInfo = this.adjustPackageInfo(
            require(path.join(this.basePath, 'node_modules', dependency, 'package.json')))
          dependencies.push(childPackageInfo)
          if (this.recursiveInclude && dependency.match(this.recursiveInclude)) {
            this.parsePackageInfo(childPackageInfo, dependencies)
          }
        }
      }
    }
    return dependencies
  }

  apply (compiler) {
    let options = this.options

    let bannerTemplate = this.bannerTemplate

    let templateData = this.adjustPackageInfo(require(path.join(this.basePath, 'package.json')))

    let dependencies = [this.adjustPackageInfo(require('webpack/package.json'))]
    this.parsePackageInfo(templateData, dependencies)
    templateData.dependencies = dependencies
      .filter(dep => !compiler.options.externals.hasOwnProperty(dep.name))
      .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1)

    if (options.additionalData) {
      Object.assign(templateData, options.additionalData)
    }

    let banner = Mustache.render(bannerTemplate, templateData)

    compiler.plugin('compilation', compilation => {
      compilation.plugin('optimize-chunk-assets', (chunks, callback) => {
        chunks.forEach(chunk => {
          if (options.entryOnly && !chunk.initial) {
            return
          }
          chunk.files
            .filter(ModuleFilenameHelpers.matchObject.bind(undefined, options))
            .forEach(file => {
              compilation.assets[file] = new ConcatSource(banner, '\n', compilation.assets[file])
            })
        })
        callback()
      })
    })
  }
}
