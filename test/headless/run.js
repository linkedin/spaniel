/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

const spawn = require('child_process').spawn;
const server = spawn('node', ['test/headless/server/app']);

var test = null;

server.stdout.on('data', (data) => {
  // Wait for signal that test app has booted
  if (data.indexOf('Serving Spaniel Test App') > -1 && !test) {
    test = spawn('./node_modules/mocha/bin/mocha', ['--compilers', 'js:babel-core/register', 'test/headless/specs/**/*.js', '--timeout', '3000']);
    //mocha --compilers js:babel-core/register test/headless/specs/**/*.js

    test.stderr.on('data', (data) => {
      console.log(`Test Error: ${data}`);
    });

    test.stdout.on('data', (data) => {
      console.log(`${data}`);
    });

    test.on('close', (code) => {
      server.kill();
      process.exit(code);
    });
  }
});

server.stderr.on('data', (data) => {
  console.log(`Error: ${data}`);
});
