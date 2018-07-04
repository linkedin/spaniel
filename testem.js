module.exports = {
  framework: "mocha+chai",
  src_files: [
    "exports/spaniel.js",
    "node_modules/sinon/pkg/sinon.js",
    "node_modules/rsvp/dist/rsvp.js",
    "test/setup/environment.js",
    "test/specs/**/*.js"
  ],
  launch_in_ci: [
    "Chrome"
  ],
  launch_in_dev: [
    "Chrome"
  ],
  browser_args: {
    Chrome: [
      process.env.TRAVIS ? '--no-sandbox' : null,
      '--headless',
      '--disable-gpu',
      '--remote-debugging-port=9222',
      '--window-size=430,430',
    ].filter(Boolean)
  }
}