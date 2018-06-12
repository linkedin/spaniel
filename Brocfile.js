/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

const Funnel = require('broccoli-funnel');
const uglify = require('broccoli-uglify-sourcemap');
const typescript = require('broccoli-typescript-compiler').default;
const Rollup = require('broccoli-rollup');
const Merge = require('broccoli-merge-trees');
const replace = require('broccoli-string-replace');

const es6Tree = typescript('src');

const spaniel = new Rollup(es6Tree, {
  rollup: {
    input: 'src/index.js',
    output: [{
      file: 'es6/index.js',
      format: 'es',
      sourcemap: true,
      exports: 'named'
    }]
  }
});

const umdTree = replace(new Rollup(es6Tree, {
  rollup: {
    input: 'src/index.js',
    output: [{
      file: 'spaniel.js',
      exports: 'named',
      format: 'umd',
      name: 'spaniel',
      sourcemap: true
    }]
  }
}), {
  files: [ 'spaniel.js' ],
  pattern: {
    match: /undefined.__extends/g,
    replacement: 'false'
  }
});

const minTree = uglify(new Funnel(umdTree, {
  destDir: 'min'
}), {
  mangle: true,
  compress: true
});

module.exports = new Merge([spaniel, es6Tree, umdTree, minTree]);
