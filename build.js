#!/usr/bin/env node

'use strict'

const path = require('path')
const getopt = require('node-getopt')
const rimraf = require('rimraf')
const fs = require('fs')

const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const ProgressPlugin = require('webpack/lib/ProgressPlugin')

const HtmlWebpackPlugin = require('html-webpack-plugin')

const devProxyConfig = require('./devProxyConfig')
const selectConfig = require('./selectConfig')

const webpackMerge = require('webpack-merge')

const mustacheLoader = require('./mustache-loader')

let args = getopt.create([
  [ 'm', 'mode=', 'The mode of the application. Either "dev" or "prod".' ],
  [ 'c', 'conf=', 'The config directory.' ],
  [ 'p', 'port=', 'The port to use. Defaults to 8080.' ],
  [ 'd', 'debug', 'Debug mode. No uglification.' ],
  [ 'h', 'host=', 'The host to use. Defaults to localhost.' ],
  [ 'v', 'verbose' ]
])
  .bindHelp()
  .parseSystem()

if (!args.options.hasOwnProperty('mode')) {
  throw new Error('Option "mode" is required.')
}

if (!args.options.hasOwnProperty('conf')) {
  throw new Error('Option "conf" is required.')
}

let verbose = args.options.verbose

const baseDir = process.cwd()
const configPath = path.join(baseDir, args.options.conf)
const webpackConfigPath = path.join(configPath, 'webpack.js')

// get the webpack.js file from the folder
try {
  fs.accessSync(webpackConfigPath)
} catch (e) {
  if (e.code === 'ENOENT') {
    throw new Error('Wrong directory or missing webpack.js file in specified directory.')
  }
}

let progress = {
  start: function () {
    let info = {
      perc: 0,
      msg: ''
    }
    this.interval = setInterval(() => console.log(info.perc + '%', info.msg), 1000)
    return new ProgressPlugin(function (perc, msg) {
      info.perc = perc * 100
      info.msg = msg
    })
  },
  stop: function () {
    clearInterval(this.interval)
  }
}

let buildConf = require(webpackConfigPath)

if (args.options.mode === 'dev') {
  // ---------------------------- dev ----------------------------

  // choose dev config wherever possible
  buildConf = selectConfig(buildConf, 'dev')
  // merge with base dev config
  buildConf = webpackMerge.smart(require('guide4you-builder/webpack.dev.js'), buildConf)

  // select mustach vars
  mustacheLoader.setTemplateVars(selectConfig(mustacheLoader.getTemplateVars(), 'dev'))

  if (buildConf.output.merge) {
    delete buildConf.output.merge
  }

  // take out the devServer config
  let serverConf = buildConf.devServer
  delete buildConf.devServer
  // configure dev proxy
  serverConf.proxy = devProxyConfig(buildConf)
  // take port out of arguments
  let port = parseInt(args.options.port) || 8080
  // set proper public path
  let host = args.options.host || 'localhost'
  buildConf.output.publicPath = `http://${host}:${port}/`

  if (verbose) {
    buildConf.devServer.stats = 'verbose'
    console.log('build conf:')
    console.log(JSON.stringify(buildConf, null, 2))
    console.log('starting compile')
  }

  // start server
  let server = new WebpackDevServer(webpack(buildConf), serverConf)
  server.listen(port)
  console.log(`Starting server on http://${host}:${port}/`)
} else if (args.options.mode === 'prod') {
  // ---------------------------- prod ----------------------------

  // choose prod config wherever possible
  buildConf = selectConfig(buildConf, 'prod')

  // merge with base prod config
  buildConf = webpackMerge.smart(require('guide4you-builder/webpack.prod.js'), buildConf)

  mustacheLoader.setTemplateVars(selectConfig(mustacheLoader.getTemplateVars(), 'prod'))

  if (args.options.hasOwnProperty('debug')) {
    let index
    for (let i = 0; i < buildConf.plugins.length; i++) {
      if (buildConf.plugins[i] instanceof webpack.optimize.UglifyJsPlugin) {
        index = i
      }
    }
    if (index) {
      buildConf.plugins.splice(index, 1)
    }
  }
  if (!buildConf.output.merge) {
    // delete old build
    rimraf.sync(path.join(buildConf.output.path, '**/!(.git)'))
  } else {
    delete buildConf.output.merge
  }

  if (verbose) {
    console.log('build conf:')
    console.log(JSON.stringify(buildConf, null, 2))
    console.log('starting compile')
  }

  // compile
  let compiler = webpack(buildConf)
  compiler.apply(progress.start())
  compiler.run((err, stats) => {
    progress.stop()
    if (err) {
      console.error(err.stack || err)
      if (err.details) {
        console.error(err.details)
      }
      return
    }

    const info = stats.toJson()

    if (stats.hasErrors()) {
      console.error(info.errors)
    }

    if (stats.hasWarnings()) {
      console.warn(info.warnings)
    }
  })
} else if (args.options.mode === 'dist') {
  // ---------------------------- dist ----------------------------

  // choose prod config wherever possible
  buildConf = selectConfig(buildConf, 'prod')

  // merge with base library config
  let buildConf1 = webpackMerge.smart(require('guide4you-builder/webpack.debug.js'), buildConf)
  buildConf1.plugins.splice(buildConf1.plugins.findIndex(p => p instanceof HtmlWebpackPlugin), 1)

  // merge with base library config
  let buildConf2 = webpackMerge.smart(require('guide4you-builder/webpack.prod.js'), buildConf)

  mustacheLoader.setTemplateVars(selectConfig(mustacheLoader.getTemplateVars(), 'prod'))

  if (!buildConf.output.merge) {
    // delete old build
    rimraf.sync(buildConf.output.path)
  }

  if (verbose) {
    buildConf1.stats = 'verbose'
    buildConf2.stats = 'verbose'
    console.log('build conf 1:')
    console.log(JSON.stringify(buildConf1, null, 2))
    console.log('build conf 2:')
    console.log(JSON.stringify(buildConf2, null, 2))
    console.log('starting compile')
  }

  // compile
  let compiler = webpack([buildConf1, buildConf2])
  compiler.apply(progress.start())
  compiler.run((err, stats) => {
    progress.stop()
    if (err) {
      console.error(err.stack || err)
      if (err.details) {
        console.error(err.details)
      }
      return
    }

    const info = stats.toJson()

    if (stats.hasErrors()) {
      console.error(info.errors)
    }

    if (stats.hasWarnings()) {
      console.warn(info.warnings)
    }
  })
}
