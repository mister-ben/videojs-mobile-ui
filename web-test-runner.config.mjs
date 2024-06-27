export default {
  nodeResolve: true, // this is required
  testFramework: {
    path: './node_modules/web-test-runner-qunit/dist/autorun.js',
    config: {
      // QUnit config (see type WTRQunitConfig)
      // noglobals: true
    }
  },
  files: ['test/plugin.test.js']
}
