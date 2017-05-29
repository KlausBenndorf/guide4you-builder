#!/usr/bin/env node

'use strict'

const path = require('path')
const getopt = require('node-getopt')
const rimraf = require('rimraf')
const fs = require('fs')

const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')

const devProxyConfig = require('./devProxyConfig')
const selectConfig = require('./selectConfig')

const webpackMerge = require('webpack-merge')

let args = getopt.create([
  [ 'm', 'mode=', 'The mode of the application. Either "dev" or "prod".' ],
  [ 'c', 'conf=', 'The config directory.' ],
  [ 'p', 'port=', 'The port to use. Defaults to 8080.' ],
  [ 'd', 'debug', 'Debug mode. No uglification.' ],
  [ 'h', 'host=', 'The host to use. Defaults to localhost.']
])
  .bindHelp()
  .parseSystem()

if (!args.options.hasOwnProperty('mode')) {
  throw new Error('Option "mode" is required.')
}

if (!args.options.hasOwnProperty('conf')) {
  throw new Error('Option "conf" is required.')
}

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

let buildConf = require(webpackConfigPath)

if (args.options.mode === 'dev') {
  // choose dev config wherever possible
  buildConf = selectConfig(buildConf, 'dev')
  // merge with base dev config
  buildConf = webpackMerge(buildConf, require('guide4you-builder/webpack.dev.js'))
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
  // compile
  let compiler = webpack(buildConf)
  // start server
  let server = new WebpackDevServer(compiler, serverConf)
  server.listen(port)
  console.log(`Starting server on http://${host}:${port}/`)
} else if (args.options.mode === 'prod') {
  // choose prod config wherever possible
  buildConf = selectConfig(buildConf, 'prod')

  // merge with base prod config
  buildConf = webpackMerge(buildConf, require('guide4you-builder/webpack.prod.js'))
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
    rimraf.sync(buildConf.output.path)
  }
  // compile
  let compiler = webpack(buildConf)
  compiler.run((err, stats) => {
    if (err) {
      console.log('Error : ' + err.message)
    }
    if (stats) {
      let jsonStats = stats.toJson()
      if (jsonStats.warnings.length > 0) {
        console.log('warnings:')
        console.log(jsonStats.warnings)
      }
      if (jsonStats.errors.length > 0) {
        console.log('errors:')
        console.log(jsonStats.errors)
      }
    }
  })
} else if (args.options.mode === 'dist') {
  // choose prod config wherever possible
  buildConf = selectConfig(buildConf, 'prod')

  // merge with base library config
  let buildConf1 = webpackMerge(buildConf, require('guide4you-builder/webpack.debug.js'))

  // merge with base library config
  let buildConf2 = webpackMerge(buildConf, require('guide4you-builder/webpack.prod.js'))

  if (!buildConf.output.merge) {
    // delete old build
    rimraf.sync(buildConf.output.path)
  }
  // compile
  let compiler = webpack(buildConf1)
  compiler.run((err, stats) => {
    if (err) {
      console.log('Error : ' + err.message)
    }
    if (stats) {
      let jsonStats = stats.toJson()
      if (jsonStats.warnings.length > 0) {
        console.log('warnings:')
        console.log(jsonStats.warnings)
      }
      if (jsonStats.errors.length > 0) {
        console.log('errors:')
        console.log(jsonStats.errors)
      }
    }
  })

  compiler = webpack(buildConf2)
  compiler.run((err, stats) => {
    if (err) {
      console.log('Error : ' + err.message)
    }
    if (stats) {
      let jsonStats = stats.toJson()
      if (jsonStats.warnings.length > 0) {
        console.log('warnings:')
        console.log(jsonStats.warnings)
      }
      if (jsonStats.errors.length > 0) {
        console.log('errors:')
        console.log(jsonStats.errors)
      }
    }
  })
}
