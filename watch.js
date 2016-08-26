/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

var chokidar = require('chokidar');
var exec = require('child_process').exec;

console.log('Watching ./src files...');

chokidar.watch('./src', {ignored: /[\/\\]\./}).on('all', (event, path) => {
  if (event === 'change') {
    console.log(path + 'changed. Rebuilding...');
    exec('./build.sh', function (error, stdout, stderr) {
      console.log('Done rebuilding!');
    });
  }
});
