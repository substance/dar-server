const colors = require('colors')
const express = require('express')
const path = require('path')
const yargs = require('yargs')

const serve = require('../src/serve')

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

serve(app, {
  serverUrl,
  port,
  rootDir,
})

app.listen(port, () =>
  console.info('DocumentArchive Server is running at', serverUrl)
)
