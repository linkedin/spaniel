/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

var gzipSize = require('gzip-size');
var fs = require('fs');
var prettyBytes = require('pretty-bytes');

var contents = fs.readFileSync('./exports/min/spaniel.js');
var kb = prettyBytes(gzipSize.sync(contents));
var msg = 'spaniel.js is ' + kb + ' gzipped.';

fs.writeFileSync('./exports/min/stats.txt', msg);

console.log(msg);
