# spaniel Changelog

### 2.6.1 (October 19, 2018)

* Add feature flag (`USE_NATIVE_IO`) to use native intersection observer when available.

### 2.5.2 (October 9, 2018)

* Backport [PR #59](https://github.com/linkedin/spaniel/pull/59). Guard against race condition.
* Travis config changes to test against release branches
* Trigger `closing` events on beforeunload instead of unload as beforeunload can be too late in some situations


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
