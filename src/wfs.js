import Gml from 'ol/format/gml'
import Wfs from 'ol/format/wfs'
import GeoJSON from 'ol/format/geojson'
import { register as registerProj4 } from 'ol/proj/proj4'
import proj4 from 'proj4'
import pick from 'lodash/pick'
import omit from 'lodash/omit'

registerProj4(proj4)

/**
 * Convert a WFS FeatureCollection to a GeoJSON FeatureCollection
 * @param {String} wfsFeatureCollectionString
 * @returns {Object} GeoJSON FeatureCollection
 */
const featureCollectionToGeoJSON = function (wfsFeatureCollectionString, paramOptions) {
  const defaultOptions = {
    inputProjection: undefined,
    outputProjection: 'EPSG:4326',
    precision: 6,
    pickProperties: null,
    omitProperties: null,
    featureTransformer: null
  }

  const options = {
    ...defaultOptions,
    ...paramOptions
  }

  const wfs = new Wfs({
    gmlFormat: new Gml()
  })
  const geoJSON = new GeoJSON()

  const foundFeatures = wfs.readFeatures(wfsFeatureCollectionString, {
    dataProjection: options.inputProjection,
    featureProjection: options.outputProjection
  })
  const foundFeatureCollection = geoJSON.writeFeaturesObject(foundFeatures, {
    dataProjection: options.outputProjection,
    featureProjection: options.outputProjection,
    rightHanded: true,
    decimals: options.precision
  })

  const transformers = []

  if (options.pickProperties) {
    transformers.push(feature => ({
      ...feature,
      properties: pick(feature.properties, options.pickProperties)
    }))
  } else if (options.omitProperties) {
    transformers.push(feature => ({
      ...feature,
      properties: omit(feature.properties, options.omitProperties)
    }))
  }

  if (options.featureTransformer) {
    transformers.push(options.featureTransformer)
  }

  if (!transformers.length) {
    return foundFeatureCollection
  }

  const computedFeatureCollection = {
    ...foundFeatureCollection,
    features: foundFeatureCollection.features.map(
      feature => transformers.reduce(
        (acc, transformer) => transformer(acc),
        feature
      )
    )
  }

  return computedFeatureCollection
}

/**
 * Convert WFS stuff to GeoJSON
 * @module wfs
 * @memberof module:gmlToGeojson
 */
export default {
  featureCollectionToGeoJSON
}
