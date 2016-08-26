Spaniel
=======

LinkedIn's JavaScript viewport tracking library and [IntersectionObserver](https://github.com/WICG/IntersectionObserver) polyfill. Track what the user actually sees.

```JavaScript
import { InteractionObserver } from 'spaniel';

new InteractionObserver((entries) => { console.log('I see you') }, {
  threshold: 0.5
}).observe(document.getElementById('my-element'));
```

Practical uses included:

* Determining advertisement impressions
* Impression discounting feedback for relevance systems
* Occlusion culling - Don't render an object until user is close to scrolling the object into the viewport

Spaniel provides APIs at multiple levels of abstraction for determining when DOM elements are visible, with the lowest level of abstraction being a polyfill for the [IntersectionObserver API](https://github.com/WICG/IntersectionObserver). Spaniel does not actually send viewport/impression tracking events, but rather should be setup to call your app code that does the actual sending of viewport/impression tracking events.

There are three different classes provided:

* `spaniel.IntersectionObserver` - A polyfill for [IntersectionObserver](https://github.com/WICG/IntersectionObserver).
* `spaniel.SpanielObserver` - Same API structure as the [IntersectionObserver](https://github.com/WICG/IntersectionObserver), but with some added functionality for adding time thresholds in addition to ratio thresholds.
* `spaniel.Watcher` - Provides an API for receiving high level events about the visibility state of DOM elements.

### spaniel.IntersectionObserver

The main part of the [IntersectionObserver](https://github.com/WICG/IntersectionObserver) API not supported by Spaniel's pollyfill is [IntersectionObserver.root](https://wicg.github.io/IntersectionObserver/#intersectionobserver-intersection-root)

### spaniel.SpanielObserver

A superset API of InteractionObserver. There are three additions:

#### Thresholds

Instead of `threshold` being an array of ratios, `threshold` is an array of objects with the following structure:

``` JavaScript
let options = {
  threshold: [{
    label: 'impressed',
    ratio: 0.5,
    time: 1000
  }]
}
```

The example threshold is only considered crossed with the intersection `ratio` has been met for the specified `time` in milliseconds. When the threshold is crossed, the resulting entry passed to the observer callback will include the `label`.

#### Observer Callback parameter

The observer callback is passed an array of change entries. In addition to the standard entry fields from `IntersectionObserver`, the following properties have been added:

* `duration` - How long the elements intersection ratio was above the threshold before going below the threshold. Only passed for change entries associated with going below the threshold.
* `entering` - Boolean describing if the intersection ratio is changing to be above the threshold ratio.
* `label` - Which threshold is being crossed
* `payload` - Optional payload object provided by `observe()`

#### `Observe()` payload parameter

`observe()` can take an optional second parameter, an object that is included in the change entry passed to the Observer callback.

#### Putting it all together

```JavaScript
import { SpanielObserver } from 'spaniel';

let observer = new SpanielObserver((entries) => {
  let entry = entries[0];
  if (entry.entering) {
    console.log(`${entry.payload.name} has been at least 50% visible for one second`);
  } else {
    console.log(`${entry.payload.name} was at least 50% visible for ${entry.duration} milliseconds`);
  }
}, {
  threshold: [{
    label: 'impressed',
    ratio: 0.5,
    time: 1000
  }]
});
let target = document.getElementById('my-element');
observer.observe(target, {
  name: 'My Element'
});
```

### spaniel.Watcher

The `Watcher` API is similar in structure, but simpler compared to the `IntersectionObserver`. `Watcher` is streamlined for practical scenarios.

```JavaScript
import { Watcher } from 'spaniel';
let watcher = new Watcher({
  time: 100,
  ratio: 0.8
});
let target = document.getElementById('my-element');
watcher.watch(target, (eventName, meta) => {
  console.log(`My element was ${eventName} for ${meta.duration} milliseconds`);
});

watcher.unwatch(myOtherTarget);
```

There are four different event types passed to the watcher callback:

* `exposed` - When at least one pixel of the DOM element is in the viewport
* `visible` - When the configured percentage of the DOM element is in the viewport, or when the DOM element takes up the configured percentage of the screen.
* `impressed` - When the DOM element has been visible for the configured amount of time.
* `impression-complete` - When an impressed element is no longer impressed. This event includes the total duration of time the element was visible.

## How it works

Under the hood, Spaniel uses [Ventana](https://www.github.com/asakusuma/ventana/), a `requestAnmiationFrame`-based stream and window utility. Spaniel does not use mutation observers, scroll listeners, or resize listeners. Instead, `requestAnmiationFrame` polling is used for performance reasons.

#### How is it tested?

Spaniel has both unit tests and a headless test suite. The headless tests are run using [Nightmare](https://github.com/segmentio/nightmare).

## Why use Spaniel?

* Provides the future-proofing of a WCIG API, but with an expanded feature-set built upon said API.
* Tested and iterated upon in production by LinkedIn since late 2014
* Highly performant, only relies on `requestAnmiationFrame`

## Installation

Spaniel is a standard NPM/CommonJS module. You can use a build tool like [browserify](http://browserify.org/) or [webpack](https://www.npmjs.com/package/webpack) to include Spaniel in your application.

If you're using [rollup](http://rollupjs.org/), an ES6 version is built at `/exports/es6/spaniel.js` (as noted by `jsnext:main` in `package.json`).

Alternatively, running *npm run build* will generate a UMD file at `/exports/spaniel.js`, and a minified UMD file at `/exports/min/spaniel.js`. You can use the minified file in production.

## Development setup
The Spaniel source code is written in [TypeScript](https://www.typescriptlang.org/).

```
// Install dependencies
npm install

// Run build
npm run build

// Watch and auto-rebuild
npm run watch

// Serve test app
npm run serve

// Run unit tests
npm run test

// Run headless tests
npm run test:headless
```

## IntersectionObserver Resources

* [https://github.com/WICG/IntersectionObserver](https://github.com/WICG/IntersectionObserver)
* [https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

## Copyright

Copyright 2016 LinkedIn Corp.  All rights reserved.
