#!/usr/bin/env node

'use strict'

const Getopt = require('node-getopt')
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')

let getopt = new Getopt([])
  .parseSystem()

getopt.setHelp(
  'Usage: node buildTests.js folder [folder+] [OPTION]\n' +
  'build all tests in the specified folders.\n' +
  '\n' +
  '[[OPTIONS]]'
)

if (getopt.argv.length < 1) {
  getopt.showHelp()
  process.exit(1)
}

const webpack = require('webpack')
const webpackMerge = require('webpack-merge')

const baseDir = process.cwd()

const inputDirs = getopt.argv.map(p => path.join(baseDir, p))

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
