/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

var Funnel = require('broccoli-funnel');
var uglify = require('broccoli-uglify-js');

var tree = new Funnel('build_tmp', {
  include: ['spaniel.js']
});

module.exports = uglify(tree, {
  mangle: true,
  compress: true
});
