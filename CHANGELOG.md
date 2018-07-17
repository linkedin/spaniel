# spaniel Changelog
### 4.0.0 (July 17, 2018)
  - Window bounds now only updates on scroll or resize event. Only if we have passive listeners to detect any user interaction.
  - Passive listeners are now only needed where the callback can preventDefault()
  - Window bounds are now cached (not the entire boundingRect object)
  - Improved heuristics to avoid polling when we believe the system is stable
  - New API Method - Allow manual declaration of custom root element
  - Unit tests have been migrated from Phantom to Headless Chrome
  - Leaky tests have been address and tests now exit upon complete
  - Address issues with excessive CPU usage and layout thrash
  - Address issues with legacy MS browsers and `getBoundingClientRect`
  - New API Method - `isDirty` and `invalidate` for State Changes 
  - Upgrade of all dependencies
  - Note: This is the last major release of Spaniel. Going forward Spaniel will have a hard dependency on Ember. Thus [Ember-Spaniel](https://github.com/asakusuma/ember-spaniel) will be the new home for All Spaniel Internals.
  
### 2.5.1 (June 28, 2018)

* Suppress Rollup AOT Warnings

### 2.5.0 (May 29, 2018)

* Fix [Security Fix #82](https://github.com/linkedin/spaniel/pull/82). Nightmare (Electron) Security Fix Bump.
* Fix [PR #80](https://github.com/linkedin/spaniel/pull/80). Backporting the custom root API. New memoization for CPU and redraw perf improvements.

### 2.4.7 (February 12, 2018)

* Fix `scheduler` now handles window proxy listeners state properly.
* Fix [Bug #76](https://github.com/linkedin/spaniel/issues/76). Watcher support for elements not within the DOM.
* Fix [Bug #75](https://github.com/linkedin/spaniel/issues/75). IE 11 may throw an exception when calling `getBoundingClientRect` on detached elements.

### 2.4.6 (January 8, 2018)

* Fix performance issue with CPU on idle, scroll and resize.
* Updated dependencies
* Add `pkg.module`

### 2.4.0 (August 22, 2017)

* Add `boundingClientRect` parameter to `Watcher` callback.

### 2.3.0 (August 4, 2017)

* Add `SpanielObserver.destroy()` to cleanup memory.
* Add `Watcher.destroy()` to cleanup memory.

### 2.2.0 (March 1, 2017)

* Better TypeScript support
  * `typings` is now defined in package.json
  * Use `Element` instead of `SpanielTrackedElement` for public APIs
* Publish [TypeDoc](http://typedoc.org/) API docs
* Various bug fixes

### 2.1.0 (November 17, 2016)

Add api for one-time determining an element's viewport state

* `elementSatisfiesRatio()`
* `queryElement()`

### 2.0.0 (November 11, 2016)

#### Breaking changes

* Remove default `time` value for `Watcher` constructor option. `impressed` and `impression-complete` will no longer fire without `time` option.
* Remove default `ratio` value for `Watcher` constructor option. `visible` will no longer fire without `ratio` option.

### 1.1.0 (November 8, 2016)

Add public utility API

* `scheduleRead()`
* `scheduleWork()`
* `on()`
* `setGlobalEngine()`

### 1.0.0 (September 29, 2016)

Initial open source release
