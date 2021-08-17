window.ASSERTIONS = [];
console.log('Load time', Date.now());

function recordEntries(entries) {
  entries.forEach(e => {
    ASSERTIONS.push(e);
  });
}

const target = document.querySelector('.tracked-item[data-id="5"]');
const observer = new spaniel.SpanielObserver(
  function(changes) {
    console.log(changes);
    recordEntries(changes);
  },
  {
    rootMargin: '0px 0px',
    threshold: [
      {
        label: 'exposed',
        ratio: 0
      },
      {
        label: 'impressed',
        ratio: 0.5,
        time: 1000
      }
    ],
    ALLOW_CACHED_SCHEDULER: true,
    USE_NATIVE_IO: true
  }
);
observer.observe(target);
