/* eslint-disable camelcase */
// Adapted from videojs-generate-karma-config 8.1.0.
// Copyright Brightcove, Inc. Licensed under Apache-2.0; see LICENSE.tooling.
const isCI = require('is-ci');
const pkg = require('../package.json');

const browserstackLaunchers = {
  bsChrome: {
    'base': 'BrowserStack',
    'browser': 'chrome',
    'os': 'Windows',
    'os_version': '11',
    'browserstack.local': 'false',
    'browserstack.video': 'false'
  },
  bsFirefox: {
    'base': 'BrowserStack',
    'browser': 'firefox',
    'os': 'Windows',
    'os_version': '11',
    'browserstack.local': 'false',
    'browserstack.video': 'false'
  },
  bsSafari15: {
    'base': 'BrowserStack',
    'browser': 'safari',
    'os': 'OS X',
    'os_version': 'Monterey',
    'browserstack.local': 'false',
    'browserstack.video': 'false'
  },
  bsSafari17: {
    'base': 'BrowserStack',
    'browser': 'safari',
    'os': 'OS X',
    'os_version': 'Sonoma',
    'browserstack.local': 'false',
    'browserstack.video': 'false'
  }
};

module.exports = function(config) {
  const serverMode = process.argv.some(arg =>
    /^(--no-single-run|--noSingleRun|--no-singleRun|--single-run=false|--singleRun=false)$/i.test(arg));
  let browsers = Array.isArray(config.browsers) ? config.browsers : [];

  if (!browsers.length && process.env.BROWSER_STACK_USERNAME) {
    browsers = Object.keys(browserstackLaunchers);
  }
  // As before, server mode waits for a browser to connect manually.
  if (serverMode) {
    browsers = [];
  }

  config.set({
    basePath: process.env.INIT_CWD || process.cwd(),
    frameworks: ['qunit', 'detectBrowsers'],
    customHeaders: [
      {match: '.*', name: 'Cache-Control', value: 'no-cache, no-store, must-revalidate'},
      {match: '.*', name: 'Pragma', value: 'no-cache'},
      {match: '.*', name: 'Expires', value: '0'}
    ],
    customLaunchers: browserstackLaunchers,
    client: {clearContext: !serverMode, qunit: {showUI: serverMode, reorder: false, testTimeout: 5000}},
    browsers,
    detectBrowsers: {
      preferHeadless: true,
      enabled: !serverMode && !browsers.length,
      usePhantomJS: false,
      postDetection: detected => detected
    },
    browserStack: {
      project: process.env.TEAMCITY_PROJECT_NAME || pkg.name,
      name: process.env.TEAMCITY_PROJECT_NAME || pkg.name,
      build: process.env.TEAMCITY_PROJECT_NAME || pkg.name,
      pollingTimeout: 30000,
      captureTimeout: 600,
      timeout: 600
    },
    reporters: [isCI ? 'dots' : 'progress', ...serverMode ? [] : ['coverage', 'coverage-results']],
    ...serverMode ? {} : {
      coverageReporter: {
        reporters: [{type: 'in-memory'}]
      }
    },
    files: [
      'node_modules/video.js/dist/video-js.css',
      'dist/*.css',
      'node_modules/sinon/pkg/sinon.js',
      'node_modules/video.js/dist/video.js',
      'test/dist/bundle.js'
    ],
    port: 9999,
    urlRoot: '/test/',
    middleware: ['staticServer'],
    // Explicitly load the same launchers and reporters as the generated config.
    plugins: [
      require('karma-browserstack-launcher'),
      require('karma-chrome-launcher'),
      require('karma-coverage'),
      {'reporter:coverage-results': ['type', require('./coverage').CoverageResults]},
      require('karma-detect-browsers'),
      require('karma-firefox-launcher'),
      require('karma-ie-launcher'),
      require('karma-qunit'),
      require('karma-safari-applescript-launcher'),
      require('karma-static-server'),
      require('karma-teamcity-reporter')
    ],
    colors: true,
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity,
    browserDisconnectTolerance: 3,
    browserDisconnectTimeout: 300000,
    captureTimeout: 30000,
    browserNoActivityTimeout: 300000
  });
};
