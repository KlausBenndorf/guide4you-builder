#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')

let curDir = process.cwd()

for (let i = 2; i < process.argv.length; i++) {
  let reponame = process.argv[i]
  let nodeModulePath = path.join(curDir, 'node_modules', reponame)
  try {
    fs.lstatSync(nodeModulePath)
    for (let fileName of fs.readdirSync(nodeModulePath)) {
      if (fileName !== 'node_modules') {
        fs.unlinkSync(path.join(nodeModulePath, fileName))
        console.log('unlinked ' + path.join(nodeModulePath, fileName))
      }
    }
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
  }
}
