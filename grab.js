#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const copy = require('ncp').ncp

const curDir = process.cwd()

for (let i = 2; i < process.argv.length; i++) {
  let reponame = process.argv[i]
  console.log('copying ' + reponame)
  let nodeModulePath = path.join(curDir, 'node_modules', reponame)
  let sourceRepoPath = path.join(curDir, '..', reponame)
  if (!fs.existsSync(nodeModulePath)) {
    throw new Error('please install package before grabbing')
  }

  copy(sourceRepoPath, nodeModulePath, {
    filter: new RegExp(reponame + '(/|\\)(?!node_modules)'),
    stopOnError: true
  }, function (err) {
    if (err) {
      console.error(err)
    }
    console.log('done!')
  })
}
