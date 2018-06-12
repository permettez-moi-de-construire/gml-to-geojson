import {
  NotImplementedError
} from './errors'

import {
  mapKeys
} from 'lodash'

import {
  deeply
} from './util'

const gmlPolygonToGeoJSON = function (
  gmlPolygon,
  {
    xmlJsOptions = {
      compact: false
    },
    prefix = 'gml',
    ...options
  }
) {
  if (xmlJsOptions.compact) {
    throw new NotImplementedError('compact mode is not supported for now')
  }

  // Sanitize prefix
  if (prefix) {
    prefix = prefix.trimEnd(':').toLowerCase() + ':'
  } else {
    prefix = ''
  }

  // Sanitize polygon
  const loweredGmlPolygon = deeply(mapKeys)(gmlPolygon, (val, key) => {
    return key.toLowerCase()
  })
}

export default {
  gmlPolygonToGeoJSON
}
