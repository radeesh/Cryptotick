/*
    ./webpack.config.js
*/
const path = require('path');
module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve('src'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/ }
    ]
  },
  devtool: 'inline-source-map'
}
