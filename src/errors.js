class NotImplementedError extends Error {
  constructor (...errorArgs) {
    super(...errorArgs)
    this.isNotImplemented = true
  }
}

export default {
  NotImplementedError
}
