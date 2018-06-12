import { assert } from 'chai'
import { describe, it } from 'mocha'
import { gmlPolygonToGeoJSON } from '../../dist/gml-to-geojson.js'

describe('gmlPolygonToGeoJSON function', () => {
  it('should be defined', () => {
    assert.isOk(gmlPolygonToGeoJSON)
  })
})
