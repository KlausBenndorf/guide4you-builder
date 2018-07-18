#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const watch = require('watch')
const copy = require('ncp').ncp
const rimraf = require('rimraf')
const Getopt = require('node-getopt')

const curDir = process.cwd()

const getopt = new Getopt([
  [ 'w', 'watch', 'Watch the files for changes.' ],
  [ 'r', 'remove', 'Remove the files for clean reinstall.' ]
])

getopt.setHelp(
  'Usage: node grab.js repository [repository+] [OPTION]\n' +
  'grabs all files but the node_modules and files starting with a ".".\n' +
  '\n' +
  '[[OPTIONS]]'
)

getopt.parseSystem()

if (getopt.argv.length < 1) {
  getopt.showHelp()
  process.exit(0)
}

function removeStatusFunc (name) {
  return function (err) {
    if (err) {
      console.error('Error removing ' + name)
      console.error(err)
    } else {
      console.log('Done removing ' + name)
    }
  }
}

function copyStatusFunc (name) {
  return function (err) {
    if (err) {
      console.error('Error copying ' + name)
      console.error(err)
    } else {
      console.log('Done copying ' + name)
    }
  }
}

for (let reponame of getopt.argv) {
  let nodeModulePath = path.join(curDir, 'node_modules', reponame)
  let sourceRepoPath = path.join(curDir, '..', reponame)
  if (!fs.existsSync(nodeModulePath)) {
    throw new Error('please install package once before grabbing to ensure that all dependencies are satisfied')
  }

  if (!getopt.options.remove) {
    console.log('copying ' + reponame)
    const filterRegEx = new RegExp(reponame + '(.(?!node_modules)[^.]|$)')
    copy(sourceRepoPath, nodeModulePath, {
      filter: filterRegEx,
      stopOnError: true
    }, copyStatusFunc(reponame))
    if (getopt.options.watch) {
      watch.watchTree(sourceRepoPath, {
        filter: function (name) {
          return filterRegEx.test(name)
        }
      }, function (f, curr, prev) {
        if (typeof f === 'object') {
          console.log('watching ' + reponame)
        } else {
          const t = path.join(nodeModulePath, path.relative(sourceRepoPath, f))
          if (curr.nlink === 0) {
            rimraf(t, removeStatusFunc(f))
          } else {
            copy(f, t, copyStatusFunc(f))
          }
        }
      })
    }
  } else {
    console.log('removing ' + reponame)
    rimraf(nodeModulePath, removeStatusFunc(reponame))
  }
}
