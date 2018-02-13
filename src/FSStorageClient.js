const readArchive = require('./readArchive')
const writeArchive = require('./writeArchive')
const path = require('path')

/*
  A storage client optimised for Desktop clients

  NOTE: No versioning is done atm, but users can do a git init in their Dar
  folders.
*/
class FSStorageClient {

  read(archiveDir) {
    return new Promise( async (resolve) => {
      let records = await readArchive(archiveDir, { noBinaryContent: true, ignoreDotFiles: true })
      // Turn binaries into urls
      Object.keys(records).forEach(recordPath => {
        let record = records[recordPath]
        if (record._binary) {
          delete record._binary
          record.encoding = 'url'
          record.data = path.join(archiveDir, record.path)
        }
      })
      resolve(records)
    })
  }

  write(archiveDir, rawArchive) {
    return new Promise( async (resolve) => {
      await _convertBlobs(rawArchive)
      await writeArchive(archiveDir, rawArchive)
      resolve(JSON.stringify({ version: 0 }))
    })
  }
}

/*
  Convert all blobs to array buffers
*/
async function _convertBlobs(records) {
  let paths = Object.keys(records)
  for (var i = 0; i < paths.length; i++) {
    let record = records[paths[i]]
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
