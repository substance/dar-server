const colors = require('colors')
const express = require('express')
const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const readArchive = require('../src/readArchive')

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
  .help()
  .argv

const app = express()
const port = argv.port || 5000
const rootDir = path.isAbsolute(argv.rootDir) ? argv.rootDir : path.join(process.cwd(), argv.rootDir)
// TODO: should this be configurable?
const serverUrl = 'http://localhost:'+port
const assetsBaseUrl = serverUrl + '/assets'

app.get('/:dar', (req, res) => {
  let id = req.params.dar || 'default'
  let archiveDir = path.join(rootDir, id)
  // checking that the archiveDir is really a subfolder of the root dir
  let relDir = path.relative(rootDir, archiveDir)
  if (relDir.charCodeAt(0) === DOT) {
    return res.status(403)
  }
  // TODO instead we should throw a special error in readArchive
  // and return a proper http status code
  fs.stat(archiveDir, (err) => {
    if (err) return res.status(404)
    readArchive(archiveDir, { noBinaryContent: true, ignoreDotFiles: true })
      .then(records => {
        // some post-processing: turn the list of records into a hash
        // and expand to real asset urls
        let result = {}
        records.forEach(record => {
          result[record.id] = record
          // content for binaries are not included
          // instead we add a URL that can be used to retrieve the statically served file
          if (record._binary) {
            delete record._binary
            record.encoding = 'url'
            record.data = `${serverUrl}/${id}/assets/${record.id}`
          }
        })
        res.json(result)
      })
      .catch((err) => {
        console.error(err)
        // TODO: map errors to classical HTTP error codes, no messages
        res.status(500)
      })
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
