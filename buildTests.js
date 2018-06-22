#!/usr/bin/env node

'use strict'

const getopt = require('node-getopt')
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')

let args = getopt.create([
  [ 'i', 'include=+', 'Include other guide4you packages into the buildTests process.' ]
])
  .bindHelp()
  .parseSystem()

const webpack = require('webpack')
const webpackMerge = require('webpack-merge')

const baseDir = process.cwd()
let inputDirs = [path.join(baseDir, 'tests')]

if (args.options.include) {
  inputDirs = inputDirs.concat(args.options.include.map(p => path.join(baseDir, p, 'tests')))
}

const outputDir = path.join(baseDir, 'build/tests')

const mask = /.*_spec\.js$/

rimraf.sync(outputDir)
mkdirp.sync(outputDir)

let baseWConf = require('./webpack.test')

let wConf = webpackMerge.smart(baseWConf, {
  entry: inputDirs
    .reduce((p, dir) => p.concat(fs.readdirSync(dir)
      .filter(f => f.match(mask))
      .map(f => path.join(dir, f))), [])
    .reduce((p, f) => {
      p[path.basename(f)] = f
      return p
    }, {}),
  output: {
    path: outputDir
  }
})

webpack(wConf, function (err, stats) {
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
