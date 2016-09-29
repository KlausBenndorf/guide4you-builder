#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

let curDir = process.cwd()

for (let i = 2; i < process.argv.length; i++) {
  let reponame = process.argv[ i ]
  let nodeModulePath = path.join(curDir, 'node_modules', reponame)
  let sourceRepoPath = path.join(curDir, '..', reponame)
  try {
    fs.lstatSync(nodeModulePath)
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new Error('please install package before linking')
    }
  }

  let sourceRepoFiles = fs.readdirSync(sourceRepoPath)

  // unlink uneeded
  for (let fileName of fs.readdirSync(nodeModulePath)) {
    if (fileName !== 'node_modules' && sourceRepoFiles.indexOf(fileName) < 0) {
      fs.unlinkSync(path.join(nodeModulePath, fileName))
      console.log('unlinked ' + path.join(nodeModulePath, fileName))
    }
  }

  for (let fileName of sourceRepoFiles) {
    if (fileName !== 'node_modules') {
      let srcFilePath = path.join(sourceRepoPath, fileName)
      let destFilePath = path.join(nodeModulePath, fileName)
      try {
        let stat = fs.lstatSync(destFilePath)
        if (!stat.isSymbolicLink()) {
          rimraf.sync(destFilePath)
          console.log('unlinked ' + destFilePath)
          fs.symlinkSync(srcFilePath, destFilePath)
          console.log('linked ' + srcFilePath)
        }
      } catch (e) {
        if (e.code !== 'ENOENT') {
          throw e
        } else {
          fs.symlinkSync(srcFilePath, destFilePath)
        }
      }
    }
  }
}
