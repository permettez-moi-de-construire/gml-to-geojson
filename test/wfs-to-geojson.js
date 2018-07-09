
import { assert } from 'chai'
import { describe, it, beforeEach, afterEach } from 'mocha'
import {
  wfs
} from '../dist/gml-to-geojson'
import fs from 'fs-extra'
import path from 'path'
import { isFeatureCollection, isFeature, positionsOf, geometriesOf } from 'gjtk'
import isClockWise from '@turf/boolean-clockwise'

const validateRings = rings => {
  const [
    outerRing,
    ...innerRings
  ] = rings
  assert.isNotOk(isClockWise(outerRing))
  innerRings.forEach(innerRing => assert.isOk(isClockWise(innerRings)))
}

const {
  featureCollectionToGeoJSON: wfsFeatureCollectionToGeoJSON
} = wfs

describe('wfsToGeoJSON function', () => {
  const projectionOptions = {
    inputProjection: 'EPSG:2154',
    outputProjection: 'EPSG:4326'
  }

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
        assert.doesNotThrow(wfsFeatureCollectionToGeoJSON.bind(null, sample, projectionOptions))
      })

      it(`should be a geoJSON FeatureCollection with ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')
        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, projectionOptions)

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

        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, projectionOptions)

        assert.notNestedPropertyVal(parsedFeatureCollection, 'features.length', 0)
      })

      it(`should have features with only EPSG:4326 coordinates with ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, projectionOptions)

        positionsOf(parsedFeatureCollection).forEach(([lng, lat]) => {
          assert.isBelow(lng, 180)
          assert.isAbove(lng, -180)
          assert.isBelow(lat, 90)
          assert.isAbove(lat, -90)
        })
      })

      it(`should have features of type polygon or MultiPolygon ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, projectionOptions)

        geometriesOf(parsedFeatureCollection).forEach(geometry => {
          assert.include(['Polygon', 'MultiPolygon'], geometry.type)
        })
      })

      const getPrecision = (a) => {
        if (!isFinite(a)) return 0

        let e = 1
        let p = 0

        while (Math.round(a * e) / e !== a) { e *= 10; p++ }
        return p
      }

      it(`should have a maximum of 6 decimals precision by default with ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, projectionOptions)

        positionsOf(parsedFeatureCollection).forEach(coordinates => {
          assert.isAtMost(getPrecision(coordinates[0]), 6)
          assert.isAtMost(getPrecision(coordinates[1]), 6)
        })

        assert(positionsOf(parsedFeatureCollection).some(coordinate => {
          return getPrecision(coordinate[0]) === 6 || getPrecision(coordinate[1]) === 6
        }), 'Some coordinates actually have 6 decimals precision')
      })

      it(`should have a maximum of x (param) decimals precision with ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

        const precision = 7

        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(
          sample, {
            ...projectionOptions,
            precision
          }
        )

        positionsOf(parsedFeatureCollection).forEach(coordinates => {
          assert.isAtMost(getPrecision(coordinates[0]), precision)
          assert.isAtMost(getPrecision(coordinates[1]), precision)
        })

        assert(positionsOf(parsedFeatureCollection).some(coordinate => {
          return getPrecision(coordinate[0]) === precision || getPrecision(coordinate[1]) === precision
        }), `Some coordinates actually have ${precision} decimals precision`)
      })

      it(`should keep only picked up properties (pickProperties option) with ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

        const keys = ['TYPE_PROT']

        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(
          sample, {
            ...projectionOptions,
            pickProperties: keys
          }
        )

        parsedFeatureCollection.features.forEach(feature => {
          assert.hasAllKeys(feature.properties, keys)
        })
      })

      it(`should omit omitted properties (omitProperties option) with ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

        const keys = ['TYPE_PROT']

        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(
          sample, {
            ...projectionOptions,
            omitProperties: keys
          }
        )

        parsedFeatureCollection.features.forEach(feature => {
          assert.doesNotHaveAnyKeys(feature.properties, keys)
        })
      })

      it(`should run featureTransformer option with ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(
          sample, {
            ...projectionOptions,
            featureTransformer: feature => ({
              ...feature,
              properties: {
                ...feature.properties,
                testKey: 'testValue'
              }
            })
          }
        )

        parsedFeatureCollection.features.forEach(feature => {
          assert.property(feature.properties, 'testKey')
          assert.propertyVal(feature.properties, 'testKey', 'testValue')
        })
      })

      it(`should run pickProperties option before featureTransformer option with ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

        const keys = ['TYPE_PROT']

        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(
          sample, {
            ...projectionOptions,
            pickProperties: keys,
            featureTransformer: feature => ({
              ...feature,
              properties: {
                ...feature.properties,
                testKey: 'testValue'
              }
            })
          }
        )

        parsedFeatureCollection.features.forEach(feature => {
          assert.hasAllKeys(feature.properties, [...keys, 'testKey'])
        })
      })

      it(`should run omitProperties option before featureTransformer option with ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

        const keys = ['TYPE_PROT']

        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(
          sample, {
            ...projectionOptions,
            omitProperties: keys,
            featureTransformer: feature => ({
              ...feature,
              properties: {
                ...feature.properties,
                TYPE_PROT: 'testValue'
              }
            })
          }
        )

        parsedFeatureCollection.features.forEach(feature => {
          assert.property(feature.properties, 'TYPE_PROT')
          assert.propertyVal(feature.properties, 'TYPE_PROT', 'testValue')
        })
      })

      it(`should add 'z' in coordinates with keepZ option with ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(
          sample, {
            ...projectionOptions,
            keepZ: true
          }
        )

        const positions = positionsOf(parsedFeatureCollection)
        assert.notEmpty(positions)
        positionsOf(parsedFeatureCollection).forEach(position => {
          assert.lengthOf(position, 3)
        })
      })

      it(`should add 'z' in coordinates without keepZ option with ${fileName}`, () => {
        const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(
          sample, {
            ...projectionOptions
          }
        )

        const positions = positionsOf(parsedFeatureCollection)
        assert.notEmpty(positions)
        positionsOf(parsedFeatureCollection).forEach(position => {
          assert.lengthOf(position, 2)
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
      const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, projectionOptions)

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
      const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, projectionOptions)

      assert.nestedPropertyVal(parsedFeatureCollection, 'features.length', 1)
      parsedFeatureCollection.features.forEach(feature => assert.ok(isFeature(feature)))
    })

    it('should return clockwises Features', () => {
      const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, projectionOptions)

      geometriesOf(parsedFeatureCollection).forEach(geometry => {
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
      const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, projectionOptions)

      assert.nestedPropertyVal(parsedFeatureCollection, 'features.length', 1)
      parsedFeatureCollection.features.forEach(feature => assert.ok(isFeature(feature)))
    })

    it('should return clockwises Features', () => {
      const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, projectionOptions)

      geometriesOf(parsedFeatureCollection).forEach(geometry => {
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
      const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, projectionOptions)

      assert.nestedPropertyVal(parsedFeatureCollection, 'features.length', 0)
    })
  })
})
