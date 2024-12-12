module.exports = {
  entry: [
    './edp_vision.js'
  ],
  module: {
    rules: [{
      test: /\.(js)$/,
      exclude: /node_modules/
    }]
  },
  externals: ['Origo'],
  resolve: {
    extensions: ['.*', '.js']
  }
};
