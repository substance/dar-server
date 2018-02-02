let fs = require('fs')
let path = require('path')

class Archive {
  constructor(dirPath) {
    if(!dirPath) throw Error('Please provide path to folder with archives')
    this.path = dirPath
  }

  retrieve(id) {
    let res = {
      version: '123',
      resources: {}
    }

    return this.isDAR(id)
      .then(exists => {
        if(!exists) throw new Error(id + ' is not a document archive')
        return this.retrieveXmlData(id, 'manifest.xml')
      })
      .then(manifest => {
        res.resources['manifest.xml'] = manifest
        return this.retrieveXmlData(id, 'manuscript.xml')
      })
      .then(manuscript => {
        res.resources['manuscript.xml'] = manuscript
        return this.retrieveAseets(id)
      })
      .then(assets => {
        Object.assign(res.resources, assets)
        return res
      })
  }

  retrieveXmlData(darId, fileName) {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.path, darId, fileName)
      let file = {}
      fs.stat(filePath, (err, stat) => {
        if(err) return reject(err)
        // Detect encoding
        file.encoding = 'utf-8'
        file.size = stat.size
        file.createdAt = stat.birthtime.getTime()
        file.updatedAt = stat.mtime.getTime()
        fs.readFile(filePath, file.encoding, (err, data) => {
          if(err) return reject(err)
          file.data = data
          return resolve(file)
        })
      })
    })
  }

  retrieveAseetData(darId, fileName) {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.path, darId, fileName)
      let file = {}
      fs.stat(filePath, (err, stat) => {
        if(err) return reject(err)
        file.encoding = 'url'
        // TODO: generate url
        file.data = 'http://localhost:4000/api/assets/' + darId + '/' + fileName
        file.size = stat.size
        file.createdAt = stat.birthtime.getTime()
        file.updatedAt = stat.mtime.getTime()
        return resolve(file)
      })
    })
  }

  retrieveAseets(darId) {
    let assets = {}

    return new Promise((resolve, reject) => {
      fs.readdir(path.join(this.path, darId), (err, items) => {
        if(err) return cb(err)

        const manifestIndex = items.indexOf('manifest.xml')
        items.splice(manifestIndex, 1)
        const manuscriptIndex = items.indexOf('manuscript.xml')
        items.splice(manuscriptIndex, 1)

        return Promise.all(items.map(item => {
          return this.retrieveAseetData(darId, item)
            .then(file => {
              assets[item] = file
            })
        })).then(() => {
          resolve(assets)
        })
      })
    })
  }

  retrieveAssetPath(darId, fileName) {
    const filePath = path.join(this.path, darId, fileName)
    return this.isDAR(darId)
      .then(exists => {
        if(!exists) throw new Error(id + ' is not a document archive')
        return this.fileExists(filePath)
      })
      .then(exists => {
        if(!exists) throw new Error('there is no ' + fileName + ' attached to a document archive ' + darId)
        return filePath
      })
  }

  isDAR(id) {
    // We consider folder DAR if the folder exists
    // and there is a manifest.xml and manuscript.xml files inside
    return Promise.all(['manifest.xml', 'manuscript.xml'].map(f => {
      return this.fileExists(path.join(this.path, id, f))
    })).then(res => res.every(b => b))
  }

  fileExists(filePath) {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (err, stat) => {
        let res = true
        if(err) res = false
        return resolve(res)
      })
    })
  }
}

module.exports = Archive
