const WriteFilePlugin = require('write-file-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = merge(common, {
  output: {
    path: `${__dirname}/../../origo/plugins/edp-vision-plugin`,
    publicPath: '/build',
    filename: 'edp_vision.js',
    libraryTarget: 'var',
    libraryExport: 'default',
    library: 'EdpVision'
  },
  mode: 'development',
  devServer: {
    static: './',
    port: 9009,
    devMiddleware: {
      writeToDisk: true
    }
  },
  plugins: [
    new CleanWebpackPlugin(),
    new WriteFilePlugin({
      test: /^(?!.*(hot)).*/,
    })
  ]
});
