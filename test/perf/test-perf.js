var { InitialRenderBenchmark, Runner } = require("chrome-tracing");

let benchmark = new InitialRenderBenchmark({
  name: "app initial render",
  url: "http://localhost:3000/",
  endMarker: "renderEnd",
  browser: {
    type: "canary"
  }
});

let runner = new Runner([benchmark]);

runner.run(1).then((result) => {
    console.log('RESULTZ');
  console.log(result);
}).catch((err) => {
    console.log('ERRORZ');
  console.error(err);
  process.exit(1);
});