/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

const Funnel = require('broccoli-funnel');
const uglify = require('broccoli-uglify-sourcemap');
const typescript = require('broccoli-typescript-compiler').default;
const Rollup = require('broccoli-rollup');
const Merge = require('broccoli-merge-trees');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const buble = require('rollup-plugin-buble');

const es6Tree = typescript('src');

const es6 = new Rollup(es6Tree, {
  annotation: 'es6',
  rollup: {
    input: 'index.js',
    external: ['spaniel'],
    output: [{
      file: 'es6/spaniel.js',
      format: 'es'
    }],
    plugins: [resolve({
      module: true,
      customResolveOptions: {
        moduleDirectory: 'node_modules'
      }
    })],  
    external: ['backburner'],
    onwarn: (o) => onRollupWarn(o)
  }
});

const umdTree = new Rollup(es6Tree, {
  annotation: 'umd',
  rollup: {
    input: 'index.js',
    external: ['spaniel'],
    output: [{
      file: 'spaniel.js',
      exports: 'named',
      format: 'umd',
      name: 'spaniel',
      sourcemap: true
    }],
    plugins: [buble(), commonjs(), resolve({
      main: true,
      customResolveOptions: {
        moduleDirectory: 'node_modules'
      }
    })],
    external: ['backburner'],
    onwarn: (o) => onRollupWarn(o)
  }
});

const minTree = uglify(new Funnel(umdTree, {
  destDir: 'min'
}), {
  mangle: true,
  compress: true
});

module.exports = new Merge([es6, umdTree, minTree]);

function onRollupWarn({ code, loc, frame, message }) {
  // ahead-of-time (AOT) compiler warning suppression
  if (code === 'THIS_IS_UNDEFINED') { return; }
  if (loc) {
    console.warn(`${loc.file} (${loc.line}:${loc.column}) ${message}`);
    if (frame) { console.warn(frame) };
  } else {
    console.warn(message);
  }
}