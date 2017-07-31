# Summary
Improve the performance of the spaniel considering all possible ways.

# Motivation
Polling requestAninmationFrame very frequently causes heigher CPU utilization and it is unnecessary. If there were no `scroll/resize/changes in the DOM` since last requestAnimationFrame cycle then there is no need to process the scheduled read and work queues unless one of them occurs.

The solution should:
- Fire all the events as expected/ as it was before.
- Reduce CPU and memory utilization.
- Should not create extra overhead while the system is idle.

# Detailed design
Rather than polling requestAnimationFrame very frequently and process whole scheduled read and work queues, it is better to process these queues in next earliest requestAnimationFrame callback only when one of the `scroll/resize/changes in the DOM` event occur. To achieve this we need to listen for scroll ,resize and DOM change events in the viewport/[root](https://wicg.github.io/IntersectionObserver/#intersectionobserver-intersection-root). 

We can listen for scroll or resize events using `addEventListener` function. But there is no standard/native way to detect the DOM modification. So we must provide an API which user can use to provide a function which will be fired when DOM change occurs. 

Suggested API to achieve this goal is a constructor to create Spaniel Instances.

### API
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