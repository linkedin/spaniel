# spaniel Changelog

### 4.0.0 (TBD)

TODO

### 3.2.0 (August 22, 2017)

* Add `boundingClientRect` as a `Watcher` callback parameter.

### 3.1.1 (July 27, 2017)

* Add `SpanielObserver.destroy()` to cleanup memory.
* Add `Watcher.destroy()` to cleanup memory.

### 3.0.0 (July 27, 2017)

* Fix `rootMargin` [sign bug](https://github.com/linkedin/spaniel/issues/24). Positive `rootMargin` values should expand the offset. This is a breaking change for anyone currently setting `rootMargin`.
* Use native `IntersectionObserver` when available
* When polling `requestAnimationFrame`, only poll every 3 frames instead of every single frame. This improves performance, but will slightly slow down reaction time to changes.

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
