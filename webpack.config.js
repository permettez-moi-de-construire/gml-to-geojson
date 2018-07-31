// const webpack = require('webpack')
const path = require('path')
const pkg = require('./package.json')
const _ = require('lodash')

const packageName = pkg.name.split('/').pop()

// const libraryName = _.camelCase(packageName)
const fileName = _.kebabCase(packageName)

const config = {
  entry: path.resolve(__dirname, 'src', 'index.js'),
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: fileName + '.js',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'standard-loader',
        exclude: /(node_modules)/
        // use "package" entry inside package.json
        // options: {}
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /(node_modules)/
      },
      {
        test: /node_modules\/ol/,
        use: 'imports-loader?window=>{},navigator=>{userAgent: ""},document=browser-shim-document,Document=browser-shim-upper-document,Node=browser-shim-node,DOMParser=browser-shim-dom-parser,XMLSerializer=browser-shim-xml-serializer'
      }
    ]
  },
  resolve: {
    modules: [path.resolve('./node_modules'), path.resolve('./src')],
    extensions: ['.json', '.js'],
    alias: {
      'browser-shim-document': path.resolve(__dirname, 'src', 'browser-shim', 'document'),
      'browser-shim-upper-document': path.resolve(__dirname, 'src', 'browser-shim', 'upper-document'),
      'browser-shim-dom-parser': path.resolve(__dirname, 'src', 'browser-shim', 'dom-parser'),
      'browser-shim-node': path.resolve(__dirname, 'src', 'browser-shim', 'node'),
      'browser-shim-xml-serializer': path.resolve(__dirname, 'src', 'browser-shim', 'xml-serializer'),
      // 'browser-shim-proj4': path.resolve(__dirname, 'src', 'browser-shim', 'proj4')
    }
  },
  // plugins: plugins,
  target: 'node'
}

module.exports = config
