import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'exports/es6/index.js',
  format: 'umd',
  dest: 'exports/es6/spaniel.js',
  exports: 'named',
  sourceMap: true,
};
