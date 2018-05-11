const { DefaultDOMElement } = require('substance')

module.exports = function extractMetadata(manifestXMLStr) {
  let result = {
    name: undefined,
    documents: []
  }
  let dom = DefaultDOMElement.parseXML(manifestXMLStr)
  // TODO: we need a way to give the DAR a title/name
  // to be shown on a dashboard

  let documents = dom.findAll('document')
  if (documents.length > 0) {
    result.documents = documents.map(el => {
      return {
        name: el.attr('name'),
        type: el.attr('type')
      }
    })
  }
  return result
}
