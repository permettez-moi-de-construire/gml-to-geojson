import {
  mapValues,
  isPlainObject
} from 'lodash'

const deeply = (map) => {
  return (obj, fn) => {
    return map(mapValues(obj, function (v) {
      return isPlainObject(v) ? deeply(map)(v, fn) : v
    }), fn)
  }
}

export default {
  deeply
}
