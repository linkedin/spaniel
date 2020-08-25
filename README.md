# Spaniel [![Build Status](https://travis-ci.org/linkedin/spaniel.svg?branch=master)](https://travis-ci.org/linkedin/spaniel) [![npm version](https://badge.fury.io/js/spaniel.svg)](https://www.npmjs.com/package/spaniel)

LinkedIn's JavaScript viewport tracking library and [IntersectionObserver](https://github.com/WICG/IntersectionObserver) polyfill. Track what the user actually sees.

```JavaScript
import { IntersectionObserver } from 'spaniel';

new IntersectionObserver((entries) => { console.log('I see you') }, {
  threshold: 0.5
}).observe(document.getElementById('my-element'));
```

Practical uses included:

* Determining advertisement impressions
* Impression discounting feedback for relevance systems
* Occlusion culling - Don't render an object until user is close to scrolling the object into the viewport

## [Usage and API Docs](https://linkedin.github.io/spaniel/)

Spaniel provides additional abstractions on top of [IntersectionObserver](https://github.com/WICG/IntersectionObserver), provides APIs for hooking into the low-level internals, and has some limitations as a non-complete polyfill. Learn more by reading the [Usage and API Docs](https://linkedin.github.io/spaniel/).

## Why use Spaniel?

* Provides the future-proofing of a WICG API, but with an expanded feature-set built upon said API.
* Tested and iterated upon in production by LinkedIn since late 2014
* Highly performant, only relies on `requestAnimationFrame`
* Extensive `requestAnmiationFrame` task/utility API

#### How is it tested?

Spaniel has both unit tests and a headless test suite. The headless tests are run using [Nightmare](https://github.com/segmentio/nightmare).

#### How big is Spaniel?

Checkout [size.txt](https://github.com/linkedin/spaniel/blob/gh-pages/size.txt) to see the current minified UMD gzipped size.

You can also run `npm run stats` to measure locally.

## Installation

Spaniel is a standard NPM/CommonJS module. You can use a build tool like [browserify](http://browserify.org/) or [webpack](https://www.npmjs.com/package/webpack) to include Spaniel in your application.

If you're using [rollup](http://rollupjs.org/), an ES6 version is built at `/exports/es6/spaniel.js` (as noted by `jsnext:main` in `package.json`).

Alternatively, running *npm run build* will generate a UMD file at `/exports/spaniel.js`, and a minified UMD file at `/exports/min/spaniel.js`. You can use the minified file in production.

## Development setup
The Spaniel source code is written in [TypeScript](https://www.typescriptlang.org/).

You will need `testem` installed globally to run the tests.

```
npm install -g testem
```

You will also need to install [phantom.js](http://phantomjs.org/download.html) globally.

```
// Install dependencies
npm install

// Run build
npm run build

// Watch and auto-rebuild
npm run watch

// Serve test app
npm run serve

// Run the tests
npm run test
```

## IntersectionObserver Resources

* [https://github.com/WICG/IntersectionObserver](https://github.com/WICG/IntersectionObserver)
* [https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

## Copyright

Copyright 2017 LinkedIn Corp.  All rights reserved.
