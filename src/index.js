import wfsToGeojson from './wfs.js'
import errors from './errors'

/**
 * Wrapper module
 * @module gmlToGeojson
 */
export default {
  wfs: {
    ...wfsToGeojson
  },
  errors
}
