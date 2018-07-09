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
const featureCollectionToGeoJSON = function (wfsFeatureCollectionString) {
  const defaultOptions = {
    inputProjection: 'EPSG:2154',
    outputProjection: 'EPSG:4326'
  }
  const wfs = new Wfs({
    gmlFormat: new Gml()
  })
  const geoJSON = new GeoJSON()
  const foundFeatures = wfs.readFeatures(wfsFeatureCollectionString)
  const foundGeoJSON = geoJSON.writeFeatures(foundFeatures, {
    dataProjection: defaultOptions.outputProjection,
    featureProjection: defaultOptions.inputProjection,
    rightHanded: true
  })
  const foundFeatureCollection = JSON.parse(foundGeoJSON)
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
