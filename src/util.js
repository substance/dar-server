const fs = require('fs')
const path = require('path')

async function isDocumentArchive(archiveDir) {
  // assuming it is a DAR if the folder exists and there is a manifest.xml
  return _fileExists(path.join(archiveDir, 'manifest.xml'))
}

function _fileExists(path) {
  return new Promise(resolve => {
    fs.exists(path, (exists) => {
      resolve(exists)
    })
  })
}


module.exports = {
  isDocumentArchive
}
