
import { assert } from 'chai'
import { describe, it, beforeEach, afterEach, before } from 'mocha'
import {
  wfs
} from '../dist/gml-to-geojson'
import fs from 'fs-extra'
import path from 'path'
import { isFeatureCollection, isFeature, positionsOf, geometriesOf } from 'gjtk'
import isClockWise from '@turf/boolean-clockwise'
import {
  DEFINITIONS
} from './projections'

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
  let proj4

  const projectionOptions = {
    // inputProjection: 'EPSG:2154',
    outputProjection: 'EPSG:4326'
  }

  beforeEach(() => {
    proj4 = require('proj4')
    projectionOptions.proj4 = proj4

    proj4.defs(Object.entries(DEFINITIONS))
  })

  afterEach(() => {
    delete require.cache[require.resolve('proj4')]
    proj4 = null
    projectionOptions.proj4 = null
  })

  const samples = [
    { fileName: 'sample-ok-3.xml', projection: 'EPSG:2154' },
    { fileName: 'sample-ko.xml', projection: 'EPSG:2154' },
    { fileName: 'sample-ok-1-cw.xml', projection: 'EPSG:2154' },
    { fileName: 'sample-ok-1-ccw.xml', projection: 'EPSG:2154' },
    { fileName: 'sample-epsg-27572.xml', projection: 'EPSG:27572' }
  ]

  const [
    workingSample3Feat,
    notWorkingSampleEmpty,
    workingSampleCw,
    workingSampleCcw,
    workingSampleEpsg27572
  ] = samples

  it('should be defined', () => {
    assert.ok(wfsFeatureCollectionToGeoJSON)
  })

  describe('Generic test with multiple samples', () => {
    samples.forEach(({ fileName, projection }) => {
      describe(`Sample ${fileName}`, () => {
        it(`shouldn't throw`, () => {
          const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')
          assert.doesNotThrow(wfsFeatureCollectionToGeoJSON.bind(null, sample, {
            ...projectionOptions,
            inputProjection: projection
          }))
        })

        it(`should be a geoJSON FeatureCollection`, () => {
          const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')
          const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, {
            ...projectionOptions,
            inputProjection: projection
          })

          assert.ok(parsedFeatureCollection)
          assert.propertyVal(parsedFeatureCollection, 'type', 'FeatureCollection')

          assert.ok(isFeatureCollection(parsedFeatureCollection))
        })
      })
    })
  })

  describe(`Working samples`, () => {
    const workingSamples = [
      workingSample3Feat,
      workingSampleCw,
      workingSampleCcw,
      workingSampleEpsg27572
    ]

    workingSamples.forEach(({ fileName, projection }) => {
      describe(`Sample ${fileName}`, () => {
        // Not working...

        // it(`should throw if proj4 doesn't have projection`, () => {
        //   const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

        //   delete require.cache[require.resolve('proj4')]
        //   const customProj4 = require('proj4')

        //   assert.throws(wfsFeatureCollectionToGeoJSON.bind(null, sample, {
        //     ...projectionOptions,
        //     proj4: customProj4,
        //     inputProjection: projection
        //   }))
        // })

        it(`should have features`, () => {
          const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

          const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, {
            ...projectionOptions,
            inputProjection: projection
          })

          assert.notNestedPropertyVal(parsedFeatureCollection, 'features.length', 0)
        })

        it(`should have features with only EPSG:4326 coordinates`, () => {
          const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

          const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, {
            ...projectionOptions,
            inputProjection: projection
          })

          positionsOf(parsedFeatureCollection).forEach(([lng, lat]) => {
            assert.isBelow(lng, 180)
            assert.isAbove(lng, -180)
            assert.isBelow(lat, 90)
            assert.isAbove(lat, -90)
          })
        })

        it(`should have features of type polygon or MultiPolygon`, () => {
          const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

          const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, {
            ...projectionOptions,
            inputProjection: projection
          })

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

        it(`should have a maximum of 6 decimals precision by default`, () => {
          const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

          const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, {
            ...projectionOptions,
            inputProjection: projection
          })

          positionsOf(parsedFeatureCollection).forEach(coordinates => {
            assert.isAtMost(getPrecision(coordinates[0]), 6)
            assert.isAtMost(getPrecision(coordinates[1]), 6)
          })

          assert(positionsOf(parsedFeatureCollection).some(coordinate => {
            return getPrecision(coordinate[0]) === 6 || getPrecision(coordinate[1]) === 6
          }), 'Some coordinates actually have 6 decimals precision')
        })

        it(`should have a maximum of x (param) decimals precision`, () => {
          const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

          const precision = 7

          const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(
            sample, {
              ...projectionOptions,
              inputProjection: projection,
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

        it(`should keep only picked up properties (pickProperties option)`, () => {
          const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

          const keys = ['SURFACE']

          const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(
            sample, {
              ...projectionOptions,
              inputProjection: projection,
              pickProperties: keys
            }
          )

          parsedFeatureCollection.features.forEach(feature => {
            assert.hasAllKeys(feature.properties, keys)
          })
        })

        it(`should omit omitted properties (omitProperties option)`, () => {
          const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

          const keys = ['SURFACE']

          const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(
            sample, {
              ...projectionOptions,
              inputProjection: projection,
              omitProperties: keys
            }
          )

          parsedFeatureCollection.features.forEach(feature => {
            assert.doesNotHaveAnyKeys(feature.properties, keys)
          })
        })

        it(`should run featureTransformer option`, () => {
          const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

          const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(
            sample, {
              ...projectionOptions,
              inputProjection: projection,
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

        it(`should run pickProperties option before featureTransformer option`, () => {
          const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

          const keys = ['SURFACE']

          const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(
            sample, {
              ...projectionOptions,
              pickProperties: keys,
              inputProjection: projection,
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

        it(`should run omitProperties option before featureTransformer option`, () => {
          const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

          const keys = ['SURFACE']

          const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(
            sample, {
              ...projectionOptions,
              omitProperties: keys,
              inputProjection: projection,
              featureTransformer: feature => ({
                ...feature,
                properties: {
                  ...feature.properties,
                  SURFACE: 'testValue'
                }
              })
            }
          )

          parsedFeatureCollection.features.forEach(feature => {
            assert.property(feature.properties, 'SURFACE')
            assert.propertyVal(feature.properties, 'SURFACE', 'testValue')
          })
        })

        it(`should add 'z' in coordinates with keepZ option`, () => {
          const sample = fs.readFileSync(path.resolve(__dirname, fileName), 'UTF-8')

          const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(
            sample, {
              ...projectionOptions,
              inputProjection: projection,
              keepZ: true
            }
          )

          const positions = positionsOf(parsedFeatureCollection)
          assert.notEmpty(positions)
          positionsOf(parsedFeatureCollection).forEach(position => {
            assert.lengthOf(position, 3)
          })
        })

        it(`should add 'z' in coordinates without keepZ option`, () => {
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
  })
  describe('Specific test', () => {
    describe(`Sample ${workingSample3Feat.fileName}`, () => {
      const { projection } = workingSample3Feat
      const sampleFileName = path.resolve(__dirname, workingSample3Feat.fileName)
      let sample

      beforeEach(() => {
        return fs.readFile(sampleFileName, 'UTF-8')
          .then(sampleContent => { sample = sampleContent })
      })

      it('should have 3 features', () => {
        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, {
          ...projectionOptions,
          inputProjection: projection
        })

        assert.nestedPropertyVal(parsedFeatureCollection, 'features.length', 3)
        parsedFeatureCollection.features.forEach(feature => assert.ok(isFeature(feature)))
      })

      afterEach(() => {
        sample = null
      })
    })

    describe(`Sample ${workingSampleCw.fileName}`, () => {
      const { projection } = workingSampleCw
      const sampleFileName = path.resolve(__dirname, workingSampleCw.fileName)
      let sample

      beforeEach(() => {
        return fs.readFile(sampleFileName, 'UTF-8')
          .then(sampleContent => { sample = sampleContent })
      })

      it('should have 1 feature', () => {
        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, {
          ...projectionOptions,
          inputProjection: projection
        })

        assert.nestedPropertyVal(parsedFeatureCollection, 'features.length', 1)
        parsedFeatureCollection.features.forEach(feature => assert.ok(isFeature(feature)))
      })

      it('should return clockwises Features', () => {
        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, {
          ...projectionOptions,
          inputProjection: projection
        })

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

    describe(`Sample ${workingSampleCcw.fileName}`, () => {
      const { projection } = workingSampleCcw
      const sampleFileName = path.resolve(__dirname, workingSampleCcw.fileName)
      let sample

      beforeEach(() => {
        return fs.readFile(sampleFileName, 'UTF-8')
          .then(sampleContent => { sample = sampleContent })
      })

      it('should have 1 feature', () => {
        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, {
          ...projectionOptions,
          inputProjection: projection
        })

        assert.nestedPropertyVal(parsedFeatureCollection, 'features.length', 1)
        parsedFeatureCollection.features.forEach(feature => assert.ok(isFeature(feature)))
      })

      it('should return clockwises Features', () => {
        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, {
          ...projectionOptions,
          inputProjection: projection
        })

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

    describe(`Sample ${notWorkingSampleEmpty.fileName}`, () => {
      it('should have 0 feature', () => {
        const { projection } = notWorkingSampleEmpty
        const sample = fs.readFileSync(path.resolve(__dirname, notWorkingSampleEmpty.fileName), 'UTF-8')
        const parsedFeatureCollection = wfsFeatureCollectionToGeoJSON(sample, {
          ...projectionOptions,
          inputProjection: projection
        })

        assert.nestedPropertyVal(parsedFeatureCollection, 'features.length', 0)
      })
    })
  })
})
