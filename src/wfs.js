import Gml from 'ol/format/gml'
import Wfs from 'ol/format/wfs'
import GeoJSON from 'ol/format/geojson'
import { register as registerProj4 } from 'ol/proj/proj4'
import proj4 from 'proj4'

registerProj4(proj4)

/**
 * Convert a WFS FeatureCollection to a GeoJSON FeatureCollection
 * @param {String} wfsFeatureCollectionString
 * @returns {Object} GeoJSON FeatureCollection
 */
const featureCollectionToGeoJSON = function (wfsFeatureCollectionString, options) {
  const defaultOptions = {
    inputProjection: undefined,
    outputProjection: 'EPSG:4326',
    ...options
  }
  const wfs = new Wfs({
    gmlFormat: new Gml()
  })
  const geoJSON = new GeoJSON()
  const foundFeatures = wfs.readFeatures(wfsFeatureCollectionString, {
    dataProjection: defaultOptions.inputProjection,
    featureProjection: defaultOptions.outputProjection
  })
  const foundFeatureCollection = geoJSON.writeFeaturesObject(foundFeatures, {
    dataProjection: defaultOptions.outputProjection,
    featureProjection: defaultOptions.outputProjection,
    rightHanded: true
  })
  return foundFeatureCollection
}

/**
 * Convert WFS stuff to GeoJSON
 * @module wfs
 * @memberof module:gmlToGeojson
 */
export default {
  featureCollectionToGeoJSON
}
