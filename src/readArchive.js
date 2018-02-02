const fs = require('fs')
const path = require('path')
const listDir = require('./listDir')

// these extensions are considered to have text content
const TEXTISH = ['txt', 'html', 'xml', 'json']

/*
  Provides a list of records found in an archive folder.
*/
module.exports = function readArchive(archiveDir, opts = {}) {
  // make sure that the given path is a dar
  return _isDocumentArchive(archiveDir)
  .then(isDocumentArchive => {
    if (!isDocumentArchive) {
      throw new Error(archiveDir + ' is not a document archive')
    }
    return _readFiles(archiveDir, opts)
  })
}

function _readFiles(archiveDir, opts) {
  // first get a list of stats
  return listDir(archiveDir, opts)
  // then retrieve a record for every file
  .then(entries => {
    let result = []
    return Promise.all(entries.map(entry => {
      return _getFileRecord(entry, opts)
      .then(record => {
        result.push(record)
      })
    })).then(() => {
      return result
    })
  })
}

function _getFileRecord(fileEntry, opts) {
  // for text files load content
  // for binaries use a url
  let record = {
    id: fileEntry.name,
    encoding: null,
    size: fileEntry.size,
    createdAt: fileEntry.birthtime.getTime(),
    updatedAt: fileEntry.mtime.getTime()
  }
  if(_isTextFile(fileEntry.name)) {
    return new Promise((resolve, reject) => {
      fs.readFile(fileEntry.path, 'utf8', (err, content) => {
        if (err) return reject(err)
        record.encoding = 'utf8'
        record.data = content
        resolve(record)
      })
    })
  } else {
    // used internally only
    record._binary = true
    if (opts.noBinaryContent) {
      return Promise.resolve(record)
    } else {
      return new Promise((resolve, reject) => {
        fs.readFile(fileEntry.path, 'hex', (err, content) => {
          if (err) return reject(err)
          record.encoding = 'hex'
          record.data = content
          resolve(record)
        })
      })
    }
  }
}

function _isDocumentArchive(archiveDir) {
  // assuming it is a DAR if the folder exists and there is a manifest.xml
  return _fileExists(path.join(archiveDir, 'manifest.xml'))
}

function _fileExists(path) {
  return new Promise(resolve => {
    fs.exists(path, (exists) => {
      resolve(exists)
    })
  })
}

function _isTextFile(f) {
  return new RegExp(`\\.(${TEXTISH.join('|')})$`).exec(f)
}