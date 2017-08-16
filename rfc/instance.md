# Summary
Changes the API to allow better customization of low-level behavior, which is required for certain performance optimizations. This RFC is focused on the API changes themselves, not the optimizations, which will be added in the future.

# Motivation

The API changes allow better customization of low-level behavior. In turn, this will:

1. Enables certain performance optimizations
2. Makes it easier to integrate Spaniel with a wider range of environments

This RFC is focused on the API changes themselves, not the optimizations, which will be added in the future.

## Environment configuration

We want to make it easy to configure spaniel for use in any environment:

1. Test environments
2. Server side rendering environments
3. Frameworks with their own job scheduling system (like Ember)

For example, a test environment might want to stub `IntersectionObserver`. Or in SSR mode, we might want to consider any element to be in the viewport for rendering purposes. Frameworks like Ember might want to ensure that any callback is scheduled via the framework's job scheduler.

## Performance Optimizations

There are two known performance optimizations that require this API change.

### Using Native IntersectionObserver when available

Whenever native `IntersectionObserver` is available, it should be used. There is an assumption that the native `IntersectionObserver` is more performant than the polyfill implementation. However, we don't want to ship the polyfill code to the browser when the browser already implements the native `IntersectionObserver`. We want to support apps that have per-browser builds.

### The polling optimization

The current `IntersectionObserver` polyfill checks every observed element every frame to see if the intersection state of an element has changed. Using requestAninmationFrame to poll on every frame requires significant CPU utilization. Meanwhile, it's not actually necessary to poll on every frame. If there were no changes to the window (scroll/resize) and no DOM changes, then there is no need to re-calculate intersection state.

The solution should:
- Fire all the events as expected/ as it was before.
- Reduce CPU and memory utilization.
- Should not create extra overhead while the system is idle.

# Detailed design
Rather than polling the viewport status of every time on every frame using `requestAnimationFrame`, Spaniel should just poll on the next animation frame after a scroll, resize or DOM change event occurs. To achieve this, we need to listen for scroll, resize and DOM change events, with respect to the viewport/[root](https://wicg.github.io/IntersectionObserver/#intersectionobserver-intersection-root). 

We can listen for scroll or resize events using `addEventListener` function. But there is no universal way to listen for DOM changes, as [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) isn't universal. So we must provide an API through which the host app can provide a hook that allows Spaniel to listen for DOM changes.

## Proposed API

```javascript
import { SpanielInstance } from 'spaniel';
const spanielInstance = new SpanielInstance({
  IntersectionObserver,
  engine : {
     onMutate,
     schedulework
  }
});
```
- **IntersectionObserver**: This will allow user to spacify what IntersectionObserver user wants to use in this spaniel instance. User can have his own implementation of IntersectionObserver or pass the native intersectionObserver. If this argurment is skipped, we will use native Intersection observer if the browser supports or we will use spaniel implementation of IntersectionObserver.

- **onMutate** : A function which fires when DOM modification occurrs.
- **schedulework**: A function to populate work queue which is to be processed in rFA callback. If we have this argument constructor will replace spaniel implementation of the schedulework. Few frameworks need all the work to be executed inside their own system. Then we need this argument.


Only when user provides `engine` object with `onMutate` function we create an `Optimized Engine`, which will use scroll/resize/DOM change events to process scheduled work and read queues in the next earliest rFA cycle. Otherwise constructor will fallback to creating normal implementation of engine which will poll rFA very frequently.

This API will provide a way to create one engine per instance. User can take advantage of this and create multiple spaniel instances, one with optimized engine and other with unoptimized engine, based on requirement.

### Interface
The spaniel instance interface looks something like below.

```typescript

interface SpanielIntersectionObserverInterface {
  new(callback: Function, options: IntersectionObserverInit): SpanielIntersectionObserver;
}

interface SpanielObserverInterface {
  new (callback: (entries: SpanielObserverEntry[]) => void, options: SpanielObserverInit): SpanielObserver;
}

interface WatcherInterface {
  new(config: WatcherConfig): Watcher;
}

interface SpanielInstance {
  public IntersectionObserver: IntersectionObserverClass;
  private engine: Engine;
  private scheduler: Scheduler;
  public scheduleRead: (callback: Function) => void;
  public scheduleWork: (callback: Function) => void;
  public eventStore: EventStore;
  public SpanielObserver: SpanielObserverInterface;
  public Watcher: WatcherInterface;
  getEventStore: () => EventStore;
  on: (eventName: string, callback: (frame: FrameInterface, id: string) => void;
  off: (eventName: string, callback: Function) => void;
  trigger: (eventName: string, value?: any) => void;
  getScheduler: () => Scheduler;
  getEngine: () => Engine;
}
```
- Each instance of spaniel will have its own `engine` and `scheduler`. These two properties are not supposed to be modified directly. So are making it private property of instance. To access the these two properties we will give two functions `getScheduler` and `getEngine`.
- Each instance will have its own event store.
- Each instance will have on, off, trigger functions to schedule/unschedule events in the instance.


# How We Teach This

Since we are allowing users to create new instances. User must changes exisiting direct usage of spaniel to creating new instances and then using it. 
Example:

Usage changes from
```JavaScript
import { IntersectionObserver } from 'spaniel';

new IntersectionObserver((entries) => { console.log('I see you') }, {
  threshold: 0.5
}).observe(document.getElementById('my-element'));
```
to
```JavaScript
import { SpanielInstance } from 'spaniel';

const spanielInstance = new SpanielInstance();
new spanielInstance.IntersectionObserver((entries) => { console.log('I see you') }, {
  threshold: 0.5
}).observe(document.getElementById('my-element'));
```

All the correspoding functions which were used directly before must be used along with instantiated object. 
Example 
- `spaniel.on()` -> `spanielInstance.on()`
- `spaniel.off()` -> `spanielInstance.off()`
- `spaniel.trigger()` -> `spanielInstance.trigger()`

# Drawback

After this upgrade there is no way to use the spaniel without instantiating the spaniel. So user who use this upgraded version must update previous implementation. There will not be any backward compatibility.

# Alternatives

One very general alternative is to wrap the requestAnimationFrame within setInterval/setTimeout function so that we poll once in predetermined time interval. But it is recommended to reduce the usage of timers in the JavaScript code.

# Unresolved questions

- Does all the framework provide a way to know when DOM changes?