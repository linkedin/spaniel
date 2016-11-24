var chromeTracing = require("chrome-tracing");
var InitialRenderBenchmark = chromeTracing.InitialRenderBenchmark;

let benchmark = new InitialRenderBenchmark({
  name: "app initial render",
  url: "http://localhost:3000/",
  endMarker: "renderEnd",
  browser: {
    type: "canary"
  }
});

benchmark.run().then((result) => {
    console.log('RESULTZ');
  console.log(result);
}).catch((err) => {
    console.log('ERRORZ');
  console.error(err);
  process.exit(1);
});