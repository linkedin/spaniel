import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'exports/es6/index.js',
  format: 'es',
  dest: 'exports/es6/spaniel.js',
  plugins: [
    nodeResolve({ jsnext: true, main: true })
  ]
};
