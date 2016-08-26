# Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.


rm -rf exports
./node_modules/tslint/bin/tslint src/**/*.ts &&
tsc &&
tsc -m es2015 -t es6 --outDir build_tmp/es6 &&
browserify -p browserify-derequire build_tmp/cjs/index.js -s spaniel -o build_tmp/spaniel.js &&
broccoli build exports &&
mkdir exports/min &&
mv exports/spaniel.js exports/min &&
mv build_tmp/cjs exports &&
mv build_tmp/es6 exports &&
mv build_tmp/spaniel.js exports &&
rollup -c &&
npm run stats
