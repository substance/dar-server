const fs = require('fs')
const path = require('path')

module.exports = async function writeVersion(archiveDir, version) {
  const versionFile = path.join(archiveDir, '.version')
  return new Promise((resolve, reject) => {
    fs.writeFile(versionFile, version, 'utf8', (err, version) => {
      if (err) reject(err)
      else resolve(version)
    })
  })
}
