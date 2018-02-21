const fs = require('fs')
const path = require('path')
const parseFormdata = require('parse-formdata')
const readArchive = require('./readArchive')
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
      let rawArchive = await readArchive(archiveDir, {
        noBinaryContent: true,
        ignoreDotFiles: true,
        versioning: opts.versioning
      })
      Object.keys(rawArchive.resources).forEach(recordPath => {
        let record = rawArchive.resources[recordPath]
        if (record._binary) {
          delete record._binary
          record.encoding = 'url'
          record.data = `${baseUrl}/${id}/assets/${record.path}`
        }
      })
      res.json(rawArchive)
    } catch(err) { // eslint-disable-line no-catch-shadow
      console.error(err)
      res.status(err.httpStatus)
    }
  })

  /*
    Endpoint for uploading files.
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
          formData.parts.forEach((part) => {
            let filename = part.filename
            let record = archive.resources[filename]
            if (!record) {
              console.error('No document record registered for blob', filename)
            } else {
              // TODO: make sure that this works in different browsers
              record.data = part.stream
            }
          })
          let version = await writeArchive(archiveDir, archive, {
            versioning: opts.versioning
          })
          res.status(200).json({ version })
        } catch (err) { // eslint-disable-line no-catch-shadow
          console.error(err)
          res.status(500)
        }
      })
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
