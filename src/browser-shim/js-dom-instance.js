// eslint-disable-next-line no-eval
const { JSDOM } = eval("require('jsdom')")

module.exports = new JSDOM().window
