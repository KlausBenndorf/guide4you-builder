#!/usr/bin/env node

'use strict'

const path = require('path')
const fs = require('fs')

const Getopt = require('node-getopt')
const ProgressPlugin = require('webpack/lib/ProgressPlugin')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')

const devProxyConfig = require('./devProxyConfig')

let getopt = new Getopt([
  [ 'c', 'conf=', 'One config file. Can contain array of configs. Required.' ],
  [ 'p', 'port=', 'The port to use. Defaults to 8080.' ],
  [ 'h', 'host=', 'The host to use. Defaults to localhost.' ],
  [ 'v', 'verbose' ]
])
  .bindHelp()
  .parseSystem()

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

let buildConfs = require(configPath)
buildConfs = buildConfs instanceof Array ? buildConfs : [buildConfs]

let i = 0
for (let buildConf of buildConfs) {
  i++

  let progress = {
    start: function (id) {
      let info = {
        perc: 0,
        msg: ''
      }
      this.interval = setInterval(() => console.log(`[${id}]: ${info.perc.toFixed(1)}% ${info.msg}`), 1000)
      return new ProgressPlugin(function (perc, msg) {
        info.perc = perc * 100
        info.msg = msg
      })
    },
    stop: function () {
      clearInterval(this.interval)
    }
  }

  if (buildConf.mode === 'development') {
    // take out the devServer config
    let serverConf = buildConf.devServer
    delete buildConf.devServer

    // configure dev proxy
    serverConf.proxy = devProxyConfig(buildConf)
    // take port out of arguments
    const port = serverConf.port = parseInt(getopt.options.port) || 8080
    // set proper public path
    const host = serverConf.host = getopt.options.host || 'localhost'
    buildConf.output.publicPath = `http://${host}:${port}/`

    if (verbose) {
      buildConf.devServer.stats = 'verbose'
      console.log('build conf:')
      console.log(JSON.stringify(buildConf, null, 2))
      console.log('starting compile')
    }

    // start server
    WebpackDevServer.addDevServerEntrypoints(buildConf, serverConf)
    const compiler = webpack(buildConf)
    const server = new WebpackDevServer(compiler, serverConf)
    server.listen(port)
    console.log(`Starting server on http://${host}:${port}/`)
  } else if (buildConf.mode === 'production') {
    // ---------------------------- prod ----------------------------

    if (verbose) {
      console.log('build conf:')
      console.log(JSON.stringify(buildConf, null, 2))
      console.log('starting compile')
    }

    // compile
    let compiler = webpack(buildConf)
    compiler.apply(progress.start(i))
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
  } else {
    console.error('build config without mode')
    process.exit(1)
  }
}
