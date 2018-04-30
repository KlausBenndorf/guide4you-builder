#!/usr/bin/env node

'use strict'

const path = require('path')
const Getopt = require('node-getopt')
const rimraf = require('rimraf')
const fs = require('fs')

const webpack = require('webpack')
const webpackMerge = require('webpack-merge')
const WebpackDevServer = require('webpack-dev-server')
const ProgressPlugin = require('webpack/lib/ProgressPlugin')

const devProxyConfig = require('./devProxyConfig')

const HtmlWebpackPlugin = require('html-webpack-plugin')

let getopt = new Getopt([
  [ 'm', 'mode=', 'The mode of the application. Either "dev" or "prod". Required.' ],
  [ 'c', 'conf=', 'The config file. Required.' ],
  [ 'd', 'debug', 'Debug mode. No uglification.' ],
  [ 'p', 'port=', 'The port to use. Defaults to 8080.' ],
  [ 'h', 'host=', 'The host to use. Defaults to localhost.' ],
  [ 'v', 'verbose' ]
])
  .bindHelp()
  .parseSystem()

if (!getopt.options.hasOwnProperty('mode')) {
  getopt.showHelp()
  process.exit(1)
}

if (!getopt.options.hasOwnProperty('conf')) {
  getopt.showHelp()
  process.exit(1)
}

let verbose = getopt.options.verbose

const baseDir = process.cwd()
const configPath = path.join(baseDir, getopt.options.conf)

// get the webpack.js file from the folder
try {
  fs.accessSync(configPath)
} catch (e) {
  if (e.code === 'ENOENT') {
    throw new Error('Wrong filepath to webpack.js.')
  }
}

let buildConf = require(configPath)

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

if (getopt.options.mode === 'dev') {
  if (buildConf.output.merge) {
    delete buildConf.output.merge
  }

  // take out the devServer config
  let serverConf = buildConf.devServer
  delete buildConf.devServer

  // configure dev proxy
  serverConf.proxy = devProxyConfig(buildConf)
  // take port out of arguments
  let port = parseInt(getopt.options.port) || 8080
  // set proper public path
  let host = getopt.options.host || 'localhost'
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
} else if (getopt.options.mode === 'prod') {
  // ---------------------------- prod ----------------------------

  if (getopt.options.hasOwnProperty('debug')) {
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
} else if (getopt.options.mode === 'dist') {
  // ---------------------------- dist ----------------------------

  // merge with base library config
  let buildDebugConf = webpackMerge.smart(require('guide4you-builder/webpack.debug.js'), buildConf)
  buildDebugConf.plugins.splice(buildDebugConf.plugins.findIndex(p => p instanceof HtmlWebpackPlugin), 1)

  if (!buildConf.output.merge) {
    // delete old build
    rimraf.sync(buildConf.output.path)
  }

  if (verbose) {
    buildConf.stats = 'verbose'
    buildDebugConf.stats = 'verbose'
    console.log('build conf 1:')
    console.log(JSON.stringify(buildConf, null, 2))
    console.log('build conf 2:')
    console.log(JSON.stringify(buildDebugConf, null, 2))
    console.log('starting compile')
  }

  // compile
  let compiler = webpack([buildConf, buildDebugConf])
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
