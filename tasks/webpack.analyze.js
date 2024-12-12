import merge from 'webpack-merge';
import CompressionPlugin from 'compression-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import prod from './webpack.prod.js';

export default merge(prod, {
  performance: {
    hints: 'warning'
  },
  plugins: [
    new CompressionPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip'
    }),
    new BundleAnalyzerPlugin()
  ]
});
