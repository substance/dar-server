const readArchive = require('./readArchive')
const writeArchive = require('./writeArchive')
const cloneArchive = require('./cloneArchive')
const path = require('path')

/*
  A storage client optimised for Desktop clients

  NOTE: No versioning is done atm, but users can do a git init in their Dar
  folders.
*/
class FSStorageClient {

  read(archiveDir) {
    return new Promise( async (resolve, reject) => {
      try {
        let rawArchive = await readArchive(archiveDir, { noBinaryContent: true, ignoreDotFiles: true })
        // Turn binaries into urls
        Object.keys(rawArchive.resources).forEach(recordPath => {
          let record = rawArchive.resources[recordPath]
          if (record._binary) {
            delete record._binary
            record.encoding = 'url'
            record.data = path.join(archiveDir, record.path)
          }
        })
        resolve(rawArchive)
      } catch(err) {
        reject(err)
      }
    })
  }

  write(archiveDir, rawArchive) {
    return new Promise( async (resolve, reject) => {
      try {
        await _convertBlobs(rawArchive)
        let version = await writeArchive(archiveDir, rawArchive)
        resolve(JSON.stringify({ version }))
      } catch(err) {
        reject(err)
      }
    })
  }

  clone(archiveDir, newArchiveDir) {
    return new Promise( async (resolve, reject) => {
      try {
        await cloneArchive(archiveDir, newArchiveDir)
        resolve()
      } catch(err) {
        reject(err)
      }
    })
  }
}

/*
  Convert all blobs to array buffers
*/
async function _convertBlobs(rawArchive) {
  let resources = rawArchive.resources
  let paths = Object.keys(resources)
  for (var i = 0; i < paths.length; i++) {
    let record = resources[paths[i]]
    if (record.encoding === 'blob') {
      record.data = await _blobToArrayBuffer(record.data)
    }
  }
}

function _blobToArrayBuffer(blob) {
  return new Promise(resolve => {
    let reader = new FileReader()
    reader.onload = function() {
      if (reader.readyState === 2) {
        var buffer = new Buffer(reader.result)
        resolve(buffer)
      }
    }
    reader.readAsArrayBuffer(blob)
  })
}


module.exports = FSStorageClient
