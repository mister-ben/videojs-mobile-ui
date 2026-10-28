const pkg = require('../package.json');

module.exports = config => {
  require('./karma.conf')(config);
  const run = process.env.GITHUB_RUN_ID || 'local';
  const attempt = process.env.GITHUB_RUN_ATTEMPT || '1';

  config.set({
    // Real iOS devices cannot reach the runner through their own localhost.
    hostname: 'bs-local.com',
    browsers: ['bsIosSafari', 'bsAndroidChrome'],
    customLaunchers: {
      bsIosSafari: {
        base: 'BrowserStack',
        browser: 'safari',
        device: 'iPhone 16',
        os: 'ios',
        // BrowserStack's JS testing API uses these legacy capability names.
        /* eslint-disable camelcase */
        os_version: '18.0',
        real_mobile: true,
        browser_version: null
      },
      bsAndroidChrome: {
        base: 'BrowserStack',
        browser: 'chrome',
        device: 'Samsung Galaxy S24',
        os: 'android',
        os_version: '14.0',
        real_mobile: true,
        browser_version: null
        /* eslint-enable camelcase */
      }
    },
    browserStack: {
      project: pkg.name,
      name: 'Mobile compatibility',
      build: `mobile-${run}-${attempt}`,
      localIdentifier: `${pkg.name}-${run}-${attempt}`,
      startTunnel: true,
      forceLocal: true,
      timeout: 600,
      pollingTimeout: 2000,
      retryLimit: 1
    },
    detectBrowsers: {enabled: false},
    // Compatibility results must not alter the desktop Codecov baseline.
    reporters: ['dots', 'BrowserStack'],
    client: {mobileCompatibility: true},
    concurrency: 1,
    captureTimeout: 180000,
    browserNoActivityTimeout: 120000,
    browserDisconnectTolerance: 0,
    singleRun: true
  });
};
