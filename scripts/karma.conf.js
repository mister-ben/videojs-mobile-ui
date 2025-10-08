const generate = require('videojs-generate-karma-config');

module.exports = function(config) {

  // see https://github.com/videojs/videojs-generate-karma-config
  // for options
  const options = {};

  config = generate(config, options);

  delete config.customLaunchers.bsSafari12;
  delete config.customLaunchers.bsSafari14;

  /* eslint-disable quote-props, camelcase */
  config.customLaunchers.bsAndroid = {
    base: 'BrowserStack',
    browser: 'chrome',
    os: 'Android',
    os_version: '16',
    'browserstack.local': 'false',
    'browserstack.video': 'false'
  };
  config.customLaunchers.bsIPhone = {
    base: 'BrowserStack',
    device: 'iPhone 15',
    os: 'ios',
    os_version: '26',
    'browserstack.local': 'false',
    'browserstack.video': 'false'
  };
  config.customLaunchers.bsSafari = {
    base: 'BrowserStack',
    browser: 'safari',
    os: 'OS X',
    os_version: 'Tahoe',
    'browserstack.local': 'false',
    'browserstack.video': 'false'
  };

  // any other custom stuff not supported by options here!
};
