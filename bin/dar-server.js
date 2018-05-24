#! /usr/bin/env node
let express = require('express')
let path = require('path')
let yargs = require('yargs')
let darServer = require('../index')

let argv = yargs.usage('$0 [port] <archivesDir>', 'start the archive server', (yargs) => {
  yargs
    .option('port', {
      alias: 'p',
      type: 'number',
      describe: 'the port that dar-server should bind to',
      default: 4100
    })
    .positional('archivesDir', {
      describe: 'a folder that conains one or more DARs'
    })
}).argv

_serve(argv)

function _serve (argv) {
  const port = argv.port
  const archiveDir = argv.archivesDir
  if (!archiveDir) {
    console.error('A path to a folder with archives must be provided')
    return
  }
  // use the `data` folder as root dir to look for archives
  const rootDir = path.isAbsolute(archiveDir) ? archiveDir : path.join(process.cwd(), archiveDir)
  // starting darServer on localhost:<port>
  // using the configured directory as root folder to look for archives
  let app = express()
  darServer.serve(app, {
    port,
    serverUrl: 'http://localhost:' + port,
    rootDir
  })
  app.listen(port, 'localhost', () => {
    console.log(`DAR server is running on http://localhost:${port}`)
  })
}
