const readArchive = require('./readArchive')
const readVersion = require('./readVersion')
const writeArchive = require('./writeArchive')
// const writeVersion = require('./writeVersion')
// const fs = require('fs')

class FSStorageClient {

  /*
    TODO: Add error handling
  */
  read(archiveDir) {

    return new Promise( async (resolve) => {
      let version = await readVersion(archiveDir)
      let records = await readArchive(archiveDir, { noBinaryContent: true, ignoreDotFiles: true })
      // some post-processing: turn the list of records into a hash
      // and expand to real asset urls
      let result = {
        version
      }
      records.forEach(record => {
        result[record.path] = record
        // content for binaries are not included
        // instead we add a URL that can be used to retrieve the statically served file
        if (record._binary) {
          delete record._binary
          record.encoding = 'url'
          record.data = `${archiveDir}/${record.path}`
        }
      })
      resolve(result)
    })
  }

  write(archiveDir, archive) {
    return new Promise( async (resolve) => {
      let version = await readVersion(archiveDir)
      // For now the client must provide the correct version number
      if (version !== archive.version) {
        throw new Error('Incompatible version')
      }
      // TODO: need a generic way to create a version
      // with git we would use the commit sha of the latest commit
      // TODO: without git this is kind of dangerous as we can't rollback
      await writeArchive(archiveDir, archive)
      // TODO: we could do something like this
      // let newVersion = String(Number.parseInt(version, 10) + 1)
      // await writeVersion(archiveDir, newVersion)
      // ... but instead we just return the same version all the time
      let newVersion = version
      // We must use a serialised version to conform to the expected output by
      // PersistedDocumentArchive
      resolve(JSON.stringify({ version: newVersion}))
    })
  }
}


module.exports = FSStorageClient
