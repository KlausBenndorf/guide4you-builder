#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

let curDir = process.cwd()

for (let i = 2; i < process.argv.length; i++) {
  let reponame = process.argv[i]
  console.log('checking ' + reponame)
  let nodeModulePath = path.join(curDir, 'node_modules', reponame)
  let sourceRepoPath = path.join(curDir, '..', reponame)
  if (!fs.existsSync(nodeModulePath)) {
    throw new Error('please install package before linking')
  }

  let sourceRepoFiles = fs.readdirSync(sourceRepoPath)

  // unlink uneeded
  for (let fileName of fs.readdirSync(nodeModulePath)) {
    if (fileName !== 'node_modules' && sourceRepoFiles.indexOf(fileName) < 0) {
      fs.unlinkSync(path.join(nodeModulePath, fileName))
      console.log('unlinked unneeded ' + path.join(nodeModulePath, fileName))
    }
  }

  for (let fileName of sourceRepoFiles) {
    if (fileName !== 'node_modules') {
      let srcFilePath = path.join(sourceRepoPath, fileName)
      let destFilePath = path.join(nodeModulePath, fileName)

      if (fs.existsSync(destFilePath)) {
        if (!fs.lstatSync(destFilePath).isSymbolicLink()) {
          rimraf.sync(destFilePath)
          console.log('deleted ' + destFilePath)
          fs.symlinkSync(srcFilePath, destFilePath)
          console.log('linked ' + srcFilePath + ' -> ' + destFilePath)
        } else {
          console.log(destFilePath + ' is a link. doing nothing.')
        }
      } else {
        fs.symlinkSync(srcFilePath, destFilePath)
        console.log('linked ' + srcFilePath + ' -> ' + destFilePath)
      }
      console.log('')
    }
  }
}
