# Build Output

## Backburner
- cjs: (common) -backburner.js
- es6: es6/backburner.js
- amd: named-amd/backburner.js

## Spaniel
- umd: exports/spaniel.js (tests)
- es6: exports/es6/spaniel.js

---

# Tests `npm run test`
## Unit Tests (Mocha + Chai)
1. `testem ci`
2. kicks off headless chrome
3. `test/specs/**/*.js`

## Headless Tests (Mocha + Chai)
1. `node test/headless/run`
2. `test/headless/server/app` spins up an express server
3. `test/app` serves the app
4. `mocha test/headless/specs/**/*.js`
5. `test/headless/test-module.js` + `test/headless/constants.js`
6. `test/headless/context.js` + `test/headless/spaniel-context.js` + `test/headless/constants.js`

---

# Baseline (DONE 7/6/2018)
- Spaniel#v4
- Backburner#8b4c2b4
- Ember-Spaniel#lynchbomb

---