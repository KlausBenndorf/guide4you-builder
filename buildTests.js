#!/usr/bin/env node

'use strict'

let fs = require('fs')
let path = require('path')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')

let babel = require('babel-core')
let webpack = require('webpack')

let baseDir = process.cwd()
let inputDir = path.join(baseDir, 'tests')
let outputDir = path.join(baseDir, 'build/tests')

let mask = /.*_spec\.js$/

rimraf.sync(outputDir)
mkdirp.sync(outputDir)

let testDirs = ['selenium', 'unit-tests']

for (let testDir of testDirs) {
  testDir = path.join(inputDir, testDir)
  if (fs.existsSync(testDir)) {
    for (let file of fs.readdirSync(testDir).filter(f => f.match(mask))) {
      let webpackConfig = {
        entry: {
          [file]: path.join(testDir, file)
        },
        target: 'node',
        externals: function(context, request, callback) {
          if (!request.match(/(guide4you)|(^\.)/)) {
            callback(null, 'commonjs ' + request)
          } else {
            callback(null, false)
          }
        },
        module: {
          loaders: [
            {
              loader: 'babel-loader',
              test: /\.js$/,
              exclude: /node_modules.(?!guide4you)/,
              query: {
                presets: 'es2015'
              }
            }
          ]
        },
        output: {
          filename: '[name]',
          path: outputDir
        }
      }

      webpack(webpackConfig, function (err, stats) {
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
  }
}
