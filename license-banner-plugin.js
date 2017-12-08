const ConcatSource = require('webpack-sources').ConcatSource
const ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers')
const Mustache = require('mustache')
const path = require('path')
const fs = require('fs')

function wrapComment (str) {
  if (str.indexOf('\n') < 0) {
    return '/*! ' + str + ' */'
  }
  return '/*!\n * ' + str.split('\n').join('\n * ') + '\n */'
}

module.exports = class LicenseBannerPlugin {
  constructor (options) {
    console.log(__dirname)

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
    this.basePath = options.basePath || path.normalize('../../')
    this.parsePeerDependencies = options.parsePeerDependencies
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

  findPackageJson (packagePath, packageName) {
    let possiblePath = path.join(packagePath, 'node_modules', packageName, 'package.json')
    if (fs.existsSync(path.join(__dirname, possiblePath))) {
      return require(possiblePath)
    } else if (packagePath !== this.basePath) {
      return this.findPackageJson(path.join(packagePath, '../../'), packageName)
    } else {
      throw new Error(`Package not found. Name: ${packageName}.`)
    }
  }

  parsePackageInfo (packageInfo, packagePath, allDependencies = []) {
    let packageDependencies = packageInfo.dependencies ? packageInfo.dependencies : {}

    if (this.parsePeerDependencies && packageInfo.peerDependencies) {
      Object.assign(packageDependencies, packageInfo.peerDependencies)
    }

    for (let dependency of Object.keys(packageDependencies)) {
      if (!allDependencies.some(d => d.name === dependency)) {
        let childPackageInfo = this.adjustPackageInfo(this.findPackageJson(packagePath, dependency))
        allDependencies.push(childPackageInfo)
        if (this.recursiveInclude && dependency.match(this.recursiveInclude)) {
          this.parsePackageInfo(childPackageInfo, path.join(packagePath, 'node_modules', dependency), allDependencies)
        }
      }
    }

    return allDependencies
  }

  apply (compiler) {
    let options = this.options

    let bannerTemplate = this.bannerTemplate

    let templateData = this.adjustPackageInfo(require(path.join(this.basePath, 'package.json')))

    let dependencies = [this.adjustPackageInfo(require('webpack/package.json'))]
    this.parsePackageInfo(templateData, this.basePath, dependencies)
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
