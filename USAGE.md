# Spaniel Usage Documentation

For overview and setup, checkout the [GitHub repo](https://github.com/linkedin/spaniel).

## API

Spaniel provides APIs at multiple levels of abstraction for determining when DOM elements are visible, with the lowest level of abstraction being a polyfill for the [IntersectionObserver API](https://github.com/WICG/IntersectionObserver). Spaniel does not actually send viewport/impression tracking events, but rather should be setup to call your app code that does the actual sending of viewport/impression tracking events.

There are three different classes provided:

* `spaniel.IntersectionObserver` - A polyfill for [IntersectionObserver](https://github.com/WICG/IntersectionObserver).
* `spaniel.SpanielObserver` - Same API structure as the [IntersectionObserver](https://github.com/WICG/IntersectionObserver), but with some added functionality for adding time thresholds in addition to ratio thresholds.
* `spaniel.Watcher` - Provides an API for receiving high level events about the visibility state of DOM elements.

### spaniel.IntersectionObserver

The main part of the [IntersectionObserver](https://github.com/WICG/IntersectionObserver) API not supported by Spaniel's pollyfill is [IntersectionObserver.root](https://wicg.github.io/IntersectionObserver/#intersectionobserver-intersection-root)

### spaniel.SpanielObserver

A superset API of IntersectionObserver. There are three additions:

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

// Cleanup when done to prevent memory leaks.
observer.destroy();
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

// Cleanup memory
watcher.destroy();
```

There are four different event types passed to the watcher callback:

* `exposed` - When any part of the DOM element is in the viewport, even if the element has zero height or width.
* `visible` - When the configured percentage of the DOM element is in the viewport, or when the DOM element takes up the configured percentage of the screen.
* `impressed` - When the DOM element has been visible for the configured amount of time.
* `impression-complete` - When an impressed element is no longer impressed. This event includes the total duration of time the element was visible.

If no config is passed to the `Watcher` constructor, only the `exposed` event is fired.

The `Watcher` constructor can be passed 4 different options:

* `time` - The time threshold
* `ratio` - The ratio threshold
* `rootMargin` - The [rootMargin](https://wicg.github.io/IntersectionObserver/#dom-intersectionobserverinit-rootmargin) in object form.
* `root` - The [root](https://wicg.github.io/IntersectionObserver/#intersectionobserver-intersection-root) element with respect to which we want to watch the target. By default it is window.

## Utility API

Under the hood, Spaniel uses `requestAnmiationFrame` to preform microtask scheduling. Spaniel does not use mutation observers, scroll listeners, or resize listeners. Instead, `requestAnmiationFrame` polling is used for [performance reasons](https://developers.google.com/web/fundamentals/performance/rendering/optimize-javascript-execution#use_requestanimationframe_for_visual_changes).

Spaniel exposes an API for hooking into the built-in `requestAnmiationFrame` task scheduling engine, or even setting your own `requestAnmiationFrame` task scheduling engine.

```JavaScript
import { on, off, scheduleRead, scheduleWork } from 'spaniel';

// Do something on scroll
on('scroll', (frame) => {
  console.log('I scrolled to ' + frame.scrollTop);
});

function onResize(frame) {
  console.log('Viewport is ' + frame.width + 'px wide');
}

// Do something on window resize
on('resize', onResize);

// Stop watching resize
off('resize', onResize);

// Triggered after all spaniel observer callbacks have fired during `beforeunload`
on('destroy', flushBeacons);

// Proxy to visibilitychange API
on('show', onTabFocus);
on('hide', onTabUnfocus);

scheduleRead(() => {
  console.log('This will get executed during the DOM read phase of the rAF loop');
});

scheduleWork(() => {
  console.log('This will get executed during the write/mutation phase of the rAF loop');
});
```

With any task engine involving the DOM, DOM reads and DOM writes [should be batched seperately](https://developers.google.com/web/fundamentals/performance/rendering/optimize-javascript-execution#reduce_complexity_or_use_web_workers). For this reason, it's important that any [work that forces a browser layout](https://gist.github.com/paulirish/5d52fb081b3570c81e3a) be scheduled via `scheduleRead()`, while any work that modifies the layout should be scheduled via `scheduleWork()`.

### Using an external requestAnmiationFrame engine

If you'd like to use a custom requestAnmiationFrame polling/task engine, use `setGlobalEngine(engine)`, where `engine` is an object that implements the [`EngineInterface`](https://github.com/linkedin/spaniel/blob/master/src/metal/interfaces.ts#L25-L28). For example, you can checkout Spaniel's internal [Engine implementation](https://github.com/linkedin/spaniel/blob/master/src/metal/engine.ts#L10-L39) or [ember-spaniel's](https://github.com/asakusuma/ember-spaniel/blob/master/addon/spaniel-engines/ember-spaniel-engine.js) implementation that hooks into [Ember's runloop](https://guides.emberjs.com/v2.12.0/applications/run-loop/).

## Copyright

Copyright 2017 LinkedIn Corp.  All rights reserved.
