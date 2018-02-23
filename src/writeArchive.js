const fs = require('fs')
const path = require('path')

/*
  TODO: Implement versioning backed by Git
        - Check if rawArchive.version === latest Git sha
        - After saving `git add` all changed files and `git commit` them
        - Return new sha (newVersion) to client
*/
module.exports = async function writeArchive(archiveDir, rawArchive, opts = {}) {
  let resourceNames = Object.keys(rawArchive.resources)
  let newVersion = "0"

  if (opts.versioning) {
    console.warn('Git based versioning is not yet implemented.')
  }

  return Promise.all(resourceNames.map(f => {
    let record = rawArchive.resources[f]
    switch(record.encoding) {
      case 'utf8': {
        return _writeFile(path.join(archiveDir, f), record.data, 'utf8')
      }
      case 'blob': {
        return _writeFile(path.join(archiveDir, f), record.data)
      }
      // TODO: are there other encodings which we want to support?
      default:
        return false
    }
  })).then(() => {
    return newVersion
  })
}

function _writeFile(p, data, encoding) {
  return new Promise((resolve, reject) => {
    if (typeof data.pipe === 'function') {
      let file = fs.createWriteStream(p)
      data.pipe(file)
      file.on('close', () => {
        resolve()
      })
    } else {
      fs.writeFile(p, data, encoding, (err) => {
        if (err) reject()
        else resolve()
      })
    }
  })
}
