
import { assert } from 'chai'
import { describe, it, beforeEach, afterEach } from 'mocha'
import {
  wfs
} from '../dist/gml-to-geojson'
import fs from 'fs-extra'
import path from 'path'
import { isFeatureCollection, isFeature, positionsOf } from 'gjtk'

const {
  featureCollectionToGeoJSON: wfsFeatureCollectionToGeoJSON
} = wfs

describe('wfsToGeoJSON function', () => {
  const sampleFileNames = [
    'sample-ok-3.xml',
    'sample-ko.xml'
  ]

  const [
    workingSample3FeatFileName,
    notWorkingSampleEmptyFileName
  ] = sampleFileNames

  it('should be defined', () => {
    assert.ok(wfsFeatureCollectionToGeoJSON)
  })

  describe('Generic test with multiple samples', () => {
    sampleFileNames.forEach(fileName => {
      it(`shouldn't throw with ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')
        assert.doesNotThrow(wfsFeatureCollectionToGeoJSON.bind(null, sample))
      })

      it(`should be a geoJSON FeatureCollection with ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')
        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample)

        assert.ok(parsedFeatureCollection)
        assert.propertyVal(parsedFeatureCollection, 'type', 'FeatureCollection')

        assert.ok(isFeatureCollection(parsedFeatureCollection))
      })
    })
  })

  describe(`Sample ${workingSample3FeatFileName}`, () => {
    const sampleFileName = path.resolve(__dirname, workingSample3FeatFileName)
    let sample

    beforeEach(() => {
      return fs.readFile(sampleFileName, 'UTF-8')
        .then(sampleContent => { sample = sampleContent })
    })

    it('should have 3 features', () => {
      const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample)

      assert.nestedPropertyVal(parsedFeatureCollection, 'features.length', 3)
      parsedFeatureCollection.features.forEach(feature => assert.ok(isFeature(feature)))
    })

    it('should have features with only EPSG:4326 coordinates', () => {
      const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample)

      positionsOf(parsedFeatureCollection).forEach(([lng, lat]) => {
        assert.isBelow(lng, 180)
        assert.isAbove(lng, -180)
        assert.isBelow(lat, 90)
        assert.isAbove(lat, -90)
      })
    })

    afterEach(() => {
      sample = null
    })
  })

  describe(`Sample ${notWorkingSampleEmptyFileName}`, () => {
    it('should have 0 features', () => {
      const sample = fs.readFileSync(path.resolve(__dirname, notWorkingSampleEmptyFileName), 'UTF-8')
      const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample)

      assert.nestedPropertyVal(parsedFeatureCollection, 'features.length', 0)
    })
  })
})
