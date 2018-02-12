const fs = require('fs')
const path = require('path')
const parseFormdata = require('parse-formdata')
const readArchive = require('./readArchive')
const readVersion = require('./readVersion')
const writeArchive = require('./writeArchive')

const DOT = '.'.charCodeAt(0)

module.exports = function serve(app, opts = {}) {
  const apiUrl = opts.apiUrl || ''
  const serverUrl = opts.serverUrl
  const rootDir = opts.rootDir
  const origin = opts.origin || '*'
  const baseUrl = apiUrl ? serverUrl+apiUrl : serverUrl

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "*");
    next();
  })

  /*
    Endpoint for reading a Dar archive
  */
  app.get(apiUrl+'/:dar', async (req, res) => {
    let id = req.params.dar || 'default'
    let archiveDir = path.join(rootDir, id)
    // checking that the archiveDir is really a subfolder of the root dir
    let relDir = path.relative(rootDir, archiveDir)
    if (relDir.charCodeAt(0) === DOT) {
      return res.status(403)
    }
    try {
      let records = await readArchive(archiveDir, { noBinaryContent: true, ignoreDotFiles: true })
      Object.keys(records).forEach(recordPath => {
        let record = records[recordPath]
        if (record._binary) {
          delete record._binary
          record.encoding = 'url'
          record.data = `${baseUrl}/${id}/assets/${record.path}`
        }
      })
      // TODO: we should not mix records and the version property
      records.version = '0'
      res.json(records)
    } catch(err) { // eslint-disable-line no-catch-shadow
      console.error(err)
      res.status(err.httpStatus)
    }
  })

  /*
    Endpoint for uploading files.

    NOTE: Versioning is disabled atm. We may wand to back it via Git.
  */
  app.put(apiUrl+'/:dar', (req, res) => {
    let id = req.params.dar || 'default'
    parseFormdata(req, (err, formData) => {
      if (err) {
        console.error(err)
        return res.status(500)
      }
      let archiveDir = path.join(rootDir, id)
      fs.stat(archiveDir, async (err) => {
        if (err) return res.status(404)
        try {
          let archive = JSON.parse(formData.fields._archive)
          let version = await readVersion(archiveDir)
          // For now the client must provide the correct version number
          if (version !== archive.version) {
            res.status(500).send('Incompatible version')
            return
          }
          formData.parts.forEach((part) => {
            let filename = part.filename
            let record = archive[filename]
            if (!record) {
              console.error('No document record registered for blob', filename)
            } else {
              // TODO: make sure that this works in different browsers
              record.data = part.stream
            }
          })
          // TODO: need a generic way to create a version
          // with git we would use the commit sha of the latest commit
          // TODO: without git this is kind of dangerous as we can't rollback
          await writeArchive(archiveDir, archive)
          // TODO: we could do something like this
          // let newVersion = String(Number.parseInt(version, 10) + 1)
          // await writeVersion(archiveDir, newVersion)
          // ... but instead we just return the same version all the time
          let newVersion = version
          res.status(200).json({ version: newVersion })
        } catch (err) { // eslint-disable-line no-catch-shadow
          console.error(err)
          res.status(500)
        }
      })
      // TODO: if done send `{ version: newVersion }`
      res.status(500)
    })
  })

  // this endpoint is used for serving files statically
  app.get(apiUrl+'/:dar/assets/:file', (req, res) => {
    let filePath = path.join(rootDir, req.params.dar, req.params.file)
    fs.stat(filePath, (err) => {
      if (err) return res.status(404)
      res.sendFile(filePath)
    })
  })

}
