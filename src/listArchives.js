const glob = require('glob')
const fs = require('fs')
const path = require('path')
const extractMetadata = require('./extractMetadata')

module.exports = function listArchives(rootDir) {
  return new Promise((resolve, reject) => {
    glob("**/manifest.xml", { cwd: rootDir, root: rootDir }, (err, files) => {
      if (err) return reject(err)
      let records = resolve(files.map(f => {
        let absPath = path.join(rootDir, f)
        let archiveDir = path.dirname(absPath)
        let archivePath = path.relative(rootDir, archiveDir)
        let xmlStr = fs.readFileSync(absPath, 'utf8')
        let record = extractMetadata(xmlStr)
        if (!record.name) {
          record.name = path.relative(path.dirname(archiveDir), archiveDir)
        }
        record.id = archivePath.replace(/\\/, '/')
        return record
      }))
      resolve(records)
    })
  })
}
