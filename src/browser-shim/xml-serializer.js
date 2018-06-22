const xmlserializer = require('xmlserializer')

class XMLSerializer {
  serializeToString (node) {
    xmlserializer.serializeToString(node)
  }
}

module.exports = XMLSerializer
