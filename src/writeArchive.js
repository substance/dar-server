const fs = require('fs')
const path = require('path')

module.exports = async function writeArchive(archiveDir, rawArchive) {
  let files = Object.keys(rawArchive)
  return Promise.all(files.map(f => {
    let record = rawArchive[f]
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
  }))
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
