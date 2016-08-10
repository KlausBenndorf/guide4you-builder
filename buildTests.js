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

let seleniumDir = path.join(inputDir, 'selenium')
if (fs.existsSync(seleniumDir)) {
  let babelOptions = {
    presets: ['es2015']
  }

  for (let filename of fs.readdirSync(seleniumDir)) {
    let code = babel.transformFileSync(path.join(seleniumDir, filename), babelOptions).code
    fs.writeFileSync(path.join(outputDir, filename), code)
  }
}

let unitTestsDir = path.join(inputDir, 'unit-tests')
if (fs.existsSync(unitTestsDir)) {
  for (let file of fs.readdirSync(unitTestsDir).filter(f => f.match(mask))) {
    let webpackConfig = {
      entry: path.join(unitTestsDir, file),
      target: 'node',
      externals: {
        'selenium-webdriver/testing/assert': 'commonjs selenium-webdriver/testing/assert'
      },
      context: baseDir,
      module: {
        loaders: [
          {
            loader: 'babel-loader',
            test: /\.js$/,
            exclude: /node_modules/,
            query: {
              presets: 'es2015'
            }
          }
        ]
      },
      output: {
        path: outputDir
      },
      resolve: {
        root: baseDir,
        alias: {
          jquery: 'jquery/dist/jquery.min',
          openlayers: 'openlayers/dist/ol'
        }
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

