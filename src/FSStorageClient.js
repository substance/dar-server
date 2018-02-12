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
      await writeArchive(archiveDir, rawArchive)
      resolve(JSON.stringify({ version: 0 }))
    })
  }
}

module.exports = FSStorageClient
