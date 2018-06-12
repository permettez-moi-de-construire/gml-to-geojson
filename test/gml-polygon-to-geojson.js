
import { assert } from 'chai'
import { describe, it } from 'mocha'
import {
  gmlPolygonToGeoJSON,
  NotImplementedError
} from '../dist/gml-to-geojson.js'

describe('gmlPolygonToGeoJSON function', () => {
  it('should be defined', () => {
    assert.isOk(gmlPolygonToGeoJSON)
  })

  it('should throw when compact mode', () => {
    assert.throws(gmlPolygonToGeoJSON.bind(null, null, { compact: true }), NotImplementedError)
    assert.doesNotThrow(gmlPolygonToGeoJSON.bind(null, null, { compact: false }))
  })
})
