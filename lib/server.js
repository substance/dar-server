const colors = require('colors')
const express = require('express')
const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const parseFormdata = require('parse-formdata')

const readArchive = require('../src/readArchive')
const readVersion = require('../src/readVersion')
const writeArchive = require('../src/writeArchive')
const writeVersion = require('../src/writeVersion')

const DOT = '.'.charCodeAt(0)
const MISSING_ROOTDIR = [
  ,
  colors.red.underline('Please provide a path to the directory which is used as root folder for archives.'),
  'Example: server -d /home/oliver/archives',
  ,
].join('\n')

const argv = yargs
  .usage('Usage: $0 -p [num] -d [path]')
  .option('d', {
    type: 'string',
    alias: 'rootDir',
    describe: 'Root directory of served archives',
    demandOption: MISSING_ROOTDIR,
  })
  .option('p', {
    type: 'number',
    alias: 'port',
    describe: 'Server port',
    default: 5000
  })
  .option('o', {
    alias: 'origin',
    type: 'string',
    describe: 'Domain from where it should be allowed to access this server (CORS).',
  })
  .help()
  .argv

const app = express()
const port = argv.port || 5000
const rootDir = path.isAbsolute(argv.rootDir) ? argv.rootDir : path.join(process.cwd(), argv.rootDir)
// TODO: should this be configurable?
const serverUrl = 'http://localhost:'+port
const origin = argv.origin || '*'

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "*");
  next();
})

app.get('/:dar', (req, res) => {
  let id = req.params.dar || 'default'
  let archiveDir = path.join(rootDir, id)
  // checking that the archiveDir is really a subfolder of the root dir
  let relDir = path.relative(rootDir, archiveDir)
  if (relDir.charCodeAt(0) === DOT) {
    return res.status(403)
  }
  // TODO instead of checking if exists we should throw a special error
  // in readArchive and return a proper http status code
  fs.stat(archiveDir, async (err) => {
    if (err) return res.status(404)
    try {
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
          record.data = `${serverUrl}/${id}/assets/${record.path}`
        }
      })
      res.json(result)
    } catch(err) { // eslint-disable-line no-catch-shadow
      console.error(err)
      // TODO: map errors to classical HTTP error codes, no messages
      res.status(500)
    }
  })
})

/*
  Endpoint for uploading files.
*/
app.put('/:dar', (req, res) => {
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
        let newVersion = String(Number.parseInt(version, 10) + 1)
        // TODO: without git this is kind of dangerous as we can't rollback
        await writeArchive(archiveDir, archive)
        await writeVersion(archiveDir, newVersion)
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
app.get('/:dar/assets/:file', (req, res) => {
  let filePath = path.join(rootDir, req.params.dar, req.params.file)
  fs.stat(filePath, (err) => {
    if (err) return res.status(404)
    res.sendFile(filePath)
  })
})

app.listen(port, () =>
  console.info('DocumentArchive Server is running at', serverUrl)
)
