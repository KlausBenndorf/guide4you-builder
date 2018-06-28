'use strict'

module.exports = {
  target: 'node',
  externals: function (context, request, callback) {
    if (!request.match(/(guide4you)|(^\.)/)) {
      callback(null, 'commonjs ' + request)
    } else {
      callback(null, false)
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules.(?!guide4you)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      }
    ]
  },
  optimization: {
    minimize: false
  },
  output: {
    filename: '[name]'
  }
}
