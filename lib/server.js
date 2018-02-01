let Archive = require('../src/Archive')
const express = require('express')
const app = express()
const port = 5000
const args = process.argv.slice(2)
const path = args[0]

let archive = new Archive(path)

app.get('/:dar', (req, res) => {
  archive.retrieve(req.params.dar)
    .then(rec => {
      res.json(rec)
    })
    .catch(err => {
      res.status(500).send(err.message)
    })
})

app.get('/:dar/assets/:file', (req, res) => {
  archive.retrieveAsset(req.params.dar, req.params.file)
    .then(filePath => {
      res.sendFile(filePath);
    })
    .catch(err => {
      res.status(500).send(err.message)
    })
})



app.listen(port, () =>
  console.log('DAR filesystems runs at', port)
)
