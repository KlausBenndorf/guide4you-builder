#!/usr/bin/env node

'use strict'

const path = require('path')
const getopt = require('node-getopt')
const rimraf = require('rimraf')

const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')

const devProxyConfig = require('./devProxyConfig')

const webpackMerge = require('webpack-merge')

let args = getopt.create([
  ['m', 'mode=', 'The mode of the application. Either "dev" or "prod".'],
  ['c', 'conf=', 'The config directory.'],
  ['p', 'port=', 'The port to use. Defaults to 8080.']
])
  .bindHelp()
  .parseSystem()

if (!args.options.hasOwnProperty('mode')) {
  throw new Error('Option "mode" is required.')
}

if (!args.options.hasOwnProperty('conf')) {
  throw new Error('Option "conf" is required.')
}

let baseDir = process.cwd()
let configPath = path.join(baseDir, args.options.conf)
let buildConf = require(path.join(configPath, 'webpack.js'))

if (args.options.mode === 'dev') {
  buildConf = webpackMerge(buildConf, require('guide4you-builder/webpack.dev.js'))
  buildConf = selectConfig(buildConf, 'dev')
  let serverConf = buildConf.devServer
  delete buildConf.devServer
  serverConf.proxy = devProxyConfig(buildConf)
  console.log(JSON.stringify(serverConf.proxy))
  let port = parseInt(args.options.port) || 8080
  buildConf.output.publicPath = `http://localhost:${port}/`
  let compiler = webpack(buildConf)
  let server = new WebpackDevServer(compiler, serverConf)
  server.listen(port)
} else if (args.options.mode === 'prod') {
  buildConf = webpackMerge(buildConf, require('guide4you-builder/webpack.prod.js'))
  buildConf = selectConfig(buildConf, 'prod')
  rimraf.sync(path.join(baseDir, buildConf.output.path))
  let compiler = webpack(buildConf)
  compiler.run((err, stats) => {
    if (err) {
      console.log('Error : ' + err.message)
    } else if (stats) {
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
