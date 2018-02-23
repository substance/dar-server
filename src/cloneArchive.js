const fs = require('fs-extra')
const { isDocumentArchive } = require('./util')

module.exports = async function cloneArchive(archiveDir, newArchiveDir) {
  // make sure that the given path is a dar
  if (await isDocumentArchive) {
    await fs.copy(archiveDir, newArchiveDir)
    return true
  } else {
    throw new Error(archiveDir + ' is not a valid document archive.')
  }
}
