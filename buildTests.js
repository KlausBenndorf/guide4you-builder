#!/usr/bin/env node

'use strict'

let fs = require('fs')
let path = require('path')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')

let webpack = require('webpack')
const webpackMerge = require('webpack-merge')

let baseDir = process.cwd()
let inputDir = path.join(baseDir, 'tests')
let outputDir = path.join(baseDir, 'build/tests')

let mask = /.*_spec\.js$/

rimraf.sync(outputDir)
mkdirp.sync(outputDir)

let baseWConf = require('./webpack.test')

for (let file of fs.readdirSync(inputDir).filter(f => f.match(mask))) {
  let wConf = webpackMerge.smart(baseWConf, {
    entry: {
      [file]: path.join(inputDir, file)
    },
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
}
