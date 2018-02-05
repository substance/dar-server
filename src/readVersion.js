const fs = require('fs')
const path = require('path')

module.exports = async function readVersion(archiveDir) {
  const versionFile = path.join(archiveDir, '.version')
  return new Promise((resolve, reject) => {
    fs.exists(versionFile, exists => {
      if (!exists) {
        resolve('0')
      } else {
        fs.readFile(versionFile, 'utf8', (err, version) => {
          if (err) reject(err)
          else resolve(version)
        })
      }
    })
  })
}
