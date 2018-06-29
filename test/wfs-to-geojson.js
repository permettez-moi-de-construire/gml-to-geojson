
import { assert } from 'chai'
import { describe, it, beforeEach, afterEach } from 'mocha'
import {
  wfs
} from '../dist/gml-to-geojson'
import fs from 'fs-extra'
import path from 'path'
import { isFeatureCollection, isFeature, positionsOf, geometriesOf } from 'gjtk'
import isClockWise from '@turf/boolean-clockwise'

const {
  featureCollectionToGeoJSON: wfsFeatureCollectionToGeoJSON
} = wfs

describe('wfsToGeoJSON function', () => {
  const sampleFileNames = [
    'sample-ok-3.xml',
    'sample-ko.xml',
    'sample-ok-1-cw.xml',
    'sample-ok-1-ccw.xml'
  ]

  const [
    workingSample3FeatFileName,
    notWorkingSampleEmptyFileName,
    workingSampleCwFileName,
    workingSampleCcwFileName
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

  describe(`Working samples`, () => {
    const workingSamplesFileNames = [
      workingSample3FeatFileName,
      workingSampleCwFileName,
      workingSampleCcwFileName
    ]

    workingSamplesFileNames.forEach(fileName => {
      it(`should have features with ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample)

        assert.notNestedPropertyVal(parsedFeatureCollection, 'features.length', 0)
      })

      it(`should have features with only EPSG:4326 coordinates with ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample)

        positionsOf(parsedFeatureCollection).forEach(([lng, lat]) => {
          assert.isBelow(lng, 180)
          assert.isAbove(lng, -180)
          assert.isBelow(lat, 90)
          assert.isAbove(lat, -90)
        })
      })

      it(`should have features of type polygon or MultiPolygon ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample)

        geometriesOf(parsedFeatureCollection).forEach(geometry => {
          assert.include(['Polygon', 'MultiPolygon'], geometry.type)
        })
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

    afterEach(() => {
      sample = null
    })
  })

  describe(`Sample ${workingSampleCwFileName}`, () => {
    const sampleFileName = path.resolve(__dirname, workingSampleCwFileName)
    let sample

    beforeEach(() => {
      return fs.readFile(sampleFileName, 'UTF-8')
        .then(sampleContent => { sample = sampleContent })
    })

    it('should have 1 feature', () => {
      const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample)

      assert.nestedPropertyVal(parsedFeatureCollection, 'features.length', 1)
      parsedFeatureCollection.features.forEach(feature => assert.ok(isFeature(feature)))
    })

    it('should return clowises Features', () => {
      const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample)

      geometriesOf(parsedFeatureCollection).forEach(geometry => {
        const validateRings = rings => {
          const [
            outerRing,
            ...innerRings
          ] = geometry.coordinates
          assert.isOk(isClockWise(outerRing))
          innerRings.forEach(innerRing => assert.isNotOk(isClockWise(innerRings)))
        }

        switch (geometry.type) {
          case 'Polygon':
            validateRings(geometry.coordinates)
            break
          case 'MultiPolygon':
            geometry.coordinates.forEach(polygonRings => validateRings(polygonRings))
            break
          default:
            assert.fail('Geometry should be Polygon or MultiPolygon')
            break
        }
      })
    })

    afterEach(() => {
      sample = null
    })
  })

  describe(`Sample ${workingSampleCcwFileName}`, () => {
    const sampleFileName = path.resolve(__dirname, workingSampleCcwFileName)
    let sample

    beforeEach(() => {
      return fs.readFile(sampleFileName, 'UTF-8')
        .then(sampleContent => { sample = sampleContent })
    })

    it('should have 1 feature', () => {
      const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample)

      assert.nestedPropertyVal(parsedFeatureCollection, 'features.length', 1)
      parsedFeatureCollection.features.forEach(feature => assert.ok(isFeature(feature)))
    })

    it('should return clowises Features', () => {
      const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample)

      geometriesOf(parsedFeatureCollection).forEach(geometry => {
        const validateRings = rings => {
          const [
            outerRing,
            ...innerRings
          ] = geometry.coordinates
          assert.isOk(isClockWise(outerRing))
          innerRings.forEach(innerRing => assert.isNotOk(isClockWise(innerRings)))
        }

        switch (geometry.type) {
          case 'Polygon':
            validateRings(geometry.coordinates)
            break
          case 'MultiPolygon':
            geometry.coordinates.forEach(polygonRings => validateRings(polygonRings))
            break
          default:
            assert.fail('Geometry should be Polygon or MultiPolygon')
            break
        }
      })
    })

    afterEach(() => {
      sample = null
    })
  })

  describe(`Sample ${notWorkingSampleEmptyFileName}`, () => {
    it('should have 0 feature', () => {
      const sample = fs.readFileSync(path.resolve(__dirname, notWorkingSampleEmptyFileName), 'UTF-8')
      const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample)

      assert.nestedPropertyVal(parsedFeatureCollection, 'features.length', 0)
    })
  })
})
