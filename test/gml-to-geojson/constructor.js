import { assert } from 'chai'
import { describe, it } from 'mocha'
import gmlToGeojson from '../../dist/gml-to-geojson.js'

console.log(gmlToGeojson)

describe('MyLib class', () => {
  describe('constructor', () => {
    it('should have foo name', () => {
      const mygmlToGeojson = new gmlToGeojson()

      assert.property(mygmlToGeojson, 'name')
      assert.propertyVal(mygmlToGeojson, 'name', 'foo')
    })
  })
})
