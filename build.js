#!/usr/bin/env node

'use strict'

const path = require('path')
const getopt = require('node-getopt')
const rimraf = require('rimraf')

const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')

const devProxyConfig = require('./devProxyConfig')
const selectConfig = require('./selectConfig')

const webpackMerge = require('webpack-merge')

let args = getopt.create([
  [ 'm', 'mode=', 'The mode of the application. Either "dev" or "prod".' ],
  [ 'c', 'conf=', 'The config directory.' ],
  [ 'p', 'port=', 'The port to use. Defaults to 8080.' ]
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

// get the webpack.js file from the folder
let buildConf = require(path.join(configPath, 'webpack.js'))

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
  buildConf.output.publicPath = `http://localhost:${port}/`
  // compile
  let compiler = webpack(buildConf)
  // start server
  let server = new WebpackDevServer(compiler, serverConf)
  server.listen(port)
} else if (args.options.mode === 'prod') {
  // choose prod config wherever possible
  buildConf = selectConfig(buildConf, 'prod')
  // merge with base prod config
  buildConf = webpackMerge(buildConf, require('guide4you-builder/webpack.prod.js'))
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
}
